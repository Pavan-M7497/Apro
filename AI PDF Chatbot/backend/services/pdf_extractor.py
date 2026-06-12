"""
services/pdf_extractor.py
Responsible for all PDF text-extraction logic.
Keep AI / LLM concerns out of this module.
"""

from dataclasses import dataclass, field
from pathlib import Path

import PyPDF2


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class ExtractionResult:
    """Structured output returned by extract_text_from_pdf."""
    text: str                      # full concatenated text
    page_count: int                # total pages in the PDF
    pages: list[str] = field(default_factory=list)   # per-page text (for future chunking)
    char_count: int = 0
    word_count: int = 0

    def __post_init__(self):
        self.char_count = len(self.text)
        self.word_count = len(self.text.split())


# ---------------------------------------------------------------------------
# Core extraction function
# ---------------------------------------------------------------------------

def extract_text_from_pdf(pdf_path: Path) -> ExtractionResult:
    """
    Extract all text from a PDF file using PyPDF2.

    Args:
        pdf_path: Absolute or relative path to a saved PDF file.

    Returns:
        ExtractionResult with full text, per-page list, and basic stats.

    Raises:
        FileNotFoundError: if pdf_path does not exist.
        ValueError: if the file is not a valid / readable PDF.
        RuntimeError: for unexpected PyPDF2 errors.
    """

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found at path: {pdf_path}")

    try:
        reader = PyPDF2.PdfReader(str(pdf_path))
    except PyPDF2.errors.PdfReadError as exc:
        raise ValueError(f"Could not read PDF (it may be corrupted or encrypted): {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"Unexpected error opening PDF: {exc}") from exc

    page_count = len(reader.pages)
    pages: list[str] = []

    for page_num, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
        except Exception:
            # If a single page fails, keep going with an empty string for that page.
            page_text = ""
        pages.append(page_text)

    full_text = "\n\n".join(pages).strip()

    return ExtractionResult(
        text=full_text,
        page_count=page_count,
        pages=pages,
    )
