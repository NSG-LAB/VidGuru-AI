import re
from typing import List, Dict, Any, Optional
from pathlib import Path
from pypdf import PdfReader
from app.core.persistence import load_json_state, save_json_state

class Chunk:
    def __init__(self, chunk_id: str, text: str, metadata: Dict[str, Any]):
        self.chunk_id = chunk_id
        self.text = text
        self.metadata = metadata

class RAGEngine:
    def __init__(self):
        # In-memory document storage: doc_id -> list of Chunks
        self.documents: Dict[str, List[Chunk]] = {}
        self.doc_summaries: Dict[str, Dict[str, Any]] = {}
        self._load_state()

    def _save_state(self) -> None:
        payload = {
            "documents": {
                doc_id: [
                    {
                        "chunk_id": c.chunk_id,
                        "text": c.text,
                        "metadata": c.metadata
                    }
                    for c in chunks
                ]
                for doc_id, chunks in self.documents.items()
            },
            "doc_summaries": self.doc_summaries,
        }
        save_json_state("rag_state.json", payload)

    def _load_state(self) -> None:
        payload = load_json_state("rag_state.json")
        raw_docs = payload.get("documents", {})
        parsed_docs: Dict[str, List[Chunk]] = {}
        for doc_id, chunks in raw_docs.items():
            parsed_docs[doc_id] = []
            for idx, chunk_data in enumerate(chunks):
                if not isinstance(chunk_data, dict):
                    continue
                parsed_docs[doc_id].append(
                    Chunk(
                        chunk_id=chunk_data.get("chunk_id", f"{doc_id}_{idx}"),
                        text=chunk_data.get("text", ""),
                        metadata=chunk_data.get("metadata", {})
                    )
                )
        self.documents = parsed_docs
        self.doc_summaries = payload.get("doc_summaries", {})

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extracts text from a PDF file."""
        reader = PdfReader(file_path)
        extracted = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted.append(f"--- Page {idx+1} ---\n{text}")
        return "\n\n".join(extracted)

    def extract_text(self, file_path: str) -> str:
        """Extracts text based on file extension."""
        path = Path(file_path)
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return self.extract_text_from_pdf(file_path)
        elif suffix in [".txt", ".md", ".markdown", ".json", ".py", ".cpp", ".java", ".js", ".ts", ".html"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    def chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
        """Hierarchical semantic & sliding window chunking."""
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            para_len = len(para)
            if current_length + para_len > chunk_size and current_chunk:
                combined_text = "\n\n".join(current_chunk)
                chunks.append(combined_text)
                if len(current_chunk) > 1 and len(current_chunk[-1]) < overlap * 2:
                    current_chunk = [current_chunk[-1], para]
                    current_length = len(current_chunk[0]) + para_len
                else:
                    current_chunk = [para]
                    current_length = para_len
            else:
                current_chunk.append(para)
                current_length += para_len

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        final_chunks = []
        for c in chunks:
            if len(c) > chunk_size * 1.5:
                sub_sentences = re.split(r'(?<=[.!?])\s+', c)
                temp = ""
                for s in sub_sentences:
                    if len(temp) + len(s) > chunk_size and temp:
                        final_chunks.append(temp)
                        temp = s
                    else:
                        temp = f"{temp} {s}".strip()
                if temp:
                    final_chunks.append(temp)
            else:
                final_chunks.append(c)

        return final_chunks if final_chunks else [text]

    def ingest_document(self, doc_id: str, filename: str, content: str) -> Dict[str, Any]:
        """Ingests raw text or file content, creates chunks and indexes them."""
        raw_chunks = self.chunk_text(content)
        chunk_objects = []
        
        for idx, chunk_text in enumerate(raw_chunks):
            metadata = {
                "doc_id": doc_id,
                "filename": filename,
                "chunk_index": idx,
                "total_chunks": len(raw_chunks),
            }
            chunk_objects.append(Chunk(f"{doc_id}_{idx}", chunk_text, metadata))

        self.documents[doc_id] = chunk_objects

        sample_text = content[:2500]
        words = re.findall(r'\b[A-Za-z]{4,}\b', sample_text.lower())
        word_freq = {}
        for w in words:
            if w not in {"with", "that", "this", "from", "they", "have", "were", "which", "there", "about"}:
                word_freq[w] = word_freq.get(w, 0) + 1
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:6]
        key_topics = [w[0].capitalize() for w in top_words]

        summary_meta = {
            "doc_id": doc_id,
            "filename": filename,
            "num_chunks": len(chunk_objects),
            "key_topics": key_topics if key_topics else ["Overview", "Core Principles", "Applications"],
            "preview": content[:400] + ("..." if len(content) > 400 else "")
        }
        self.doc_summaries[doc_id] = summary_meta
        self._save_state()
        return summary_meta

    def _calculate_bm25_sim(self, query_terms: List[str], text: str) -> float:
        """Lightweight BM25/TF-IDF similarity score."""
        text_lower = text.lower()
        score = 0.0
        for term in query_terms:
            if not term:
                continue
            count = text_lower.count(term)
            if count > 0:
                tf = (count * 2.2) / (count + 1.2 * (1.0 - 0.25 + 0.25 * (len(text) / 500.0)))
                score += tf
        return score

    def retrieve(self, doc_id: str, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Retrieves most relevant chunks for a given pedagogical query."""
        if doc_id not in self.documents:
            return []

        chunks = self.documents[doc_id]
        query_terms = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 2]
        
        scored_chunks = []
        for chunk in chunks:
            bm25_score = self._calculate_bm25_sim(query_terms, chunk.text)
            scored_chunks.append((chunk, bm25_score))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for chunk, score in scored_chunks[:top_k]:
            results.append({
                "chunk_id": chunk.chunk_id,
                "text": chunk.text,
                "metadata": chunk.metadata,
                "relevance_score": score
            })
        return results

    def get_all_context(self, doc_id: str, max_chars: int = 12000) -> str:
        """Returns the consolidated content of the document up to max_chars."""
        if doc_id not in self.documents:
            return ""
        all_text = "\n\n".join([c.text for c in self.documents[doc_id]])
        return all_text[:max_chars]

rag_engine = RAGEngine()
