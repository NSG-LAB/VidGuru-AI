import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.core.config import settings
from app.services.rag_engine import rag_engine
from app.models.schemas import DocumentUploadResponse

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Uploads a PDF, TXT, or Markdown document, parses it, and indexes into RAG engine."""
    doc_id = str(uuid.uuid4())[:12]
    filename = file.filename or f"doc_{doc_id}.pdf"
    
    file_ext = Path(filename).suffix.lower()
    if file_ext not in [".pdf", ".txt", ".md", ".json", ".py", ".cpp", ".js"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}. Please upload PDF, TXT, or Markdown."
        )

    file_path = settings.UPLOADS_DIR / f"{doc_id}_{filename}"
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Extract text using RAGEngine
        content = rag_engine.extract_text(str(file_path))
        if not content.strip():
            raise HTTPException(status_code=400, detail="Could not extract any readable text from the file.")

        summary_meta = rag_engine.ingest_document(doc_id=doc_id, filename=filename, content=content)
        
        return DocumentUploadResponse(
            doc_id=doc_id,
            filename=filename,
            num_pages=summary_meta.get("num_chunks", 1),
            num_chunks=summary_meta.get("num_chunks", 1),
            summary=summary_meta.get("preview", "Document indexed successfully."),
            key_topics=summary_meta.get("key_topics", ["Overview", "Core Concepts"])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.get("/status/{doc_id}")
async def get_document_status(doc_id: str):
    """Checks the status and summary of an ingested document."""
    if doc_id not in rag_engine.documents:
        raise HTTPException(status_code=404, detail="Document not found")
    return rag_engine.doc_summaries.get(doc_id, {"status": "indexed"})
