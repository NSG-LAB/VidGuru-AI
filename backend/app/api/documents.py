import logging
import uuid
import re
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.config import settings
from app.core.security import enforce_generation_guard
from app.services.rag_engine import rag_engine
from app.models.schemas import DocumentUploadResponse

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])
logger = logging.getLogger("DocumentsAPI")

ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".txt", ".md", ".json", ".py", ".cpp", ".js"}
ALLOWED_UPLOAD_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/json",
    "text/x-python",
    "text/javascript",
    "application/javascript",
    "application/octet-stream",
}

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    _guard: None = Depends(enforce_generation_guard),
):
    """Uploads a PDF, TXT, or Markdown document, parses it, and indexes into RAG engine."""
    doc_id = str(uuid.uuid4())[:12]
    original_filename = file.filename or f"doc_{doc_id}.txt"
    safe_filename = re.sub(r"[^A-Za-z0-9._-]", "_", Path(original_filename).name)
    filename = safe_filename or f"doc_{doc_id}.txt"
    
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}. Please upload a supported file type."
        )
    if file.content_type and file.content_type.lower() not in ALLOWED_UPLOAD_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file content type.")

    max_upload_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    raw_bytes = await file.read(max_upload_bytes + 1)
    if len(raw_bytes) > max_upload_bytes:
        raise HTTPException(status_code=413, detail="Upload exceeds the configured size limit.")
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    file_path = settings.UPLOADS_DIR / f"{doc_id}_{filename}"
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        buffer.write(raw_bytes)

    try:
        # Extract text using RAGEngine
        content = rag_engine.extract_text(str(file_path))
        if not content.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from this file.")

        summary_meta = rag_engine.ingest_document(doc_id=doc_id, filename=filename, content=content)
        
        return DocumentUploadResponse(
            doc_id=doc_id,
            filename=filename,
            num_pages=summary_meta.get("num_chunks", 1),
            num_chunks=summary_meta.get("num_chunks", 1),
            summary=summary_meta.get("preview", "Document indexed successfully."),
            key_topics=summary_meta.get("key_topics", ["Overview", "Core Concepts"])
        )
    except HTTPException:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise
    except Exception:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        logger.exception("Failed processing uploaded document for doc_id=%s", doc_id)
        raise HTTPException(status_code=500, detail="Failed to process document.")

@router.get("/status/{doc_id}")
async def get_document_status(doc_id: str):
    """Checks the status and summary of an ingested document."""
    if doc_id not in rag_engine.documents:
        raise HTTPException(status_code=404, detail="Document not found")
    return rag_engine.doc_summaries.get(doc_id, {"status": "indexed"})
