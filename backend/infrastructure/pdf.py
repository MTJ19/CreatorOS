import io
import logging

from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text(pdf_bytes: bytes) -> str:
    """Best-effort text extraction. Returns "" for scanned/image-only PDFs
    or anything that fails to parse — callers should treat that as
    "nothing to scan" rather than an error."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        logger.exception("Failed to extract text from uploaded PDF")
        return ""
