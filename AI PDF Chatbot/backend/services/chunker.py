"""
services/chunker.py
───────────────────
Splits extracted PDF text into overlapping chunks suitable for embedding.
Using RecursiveCharacterTextSplitter which tries to keep paragraph/sentence
boundaries intact before falling back to smaller separators.
"""

from dataclasses import dataclass, field
from langchain_text_splitters import RecursiveCharacterTextSplitter


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class ChunkResult:
    """Output returned by chunk_text."""
    chunks: list[str]           # list of text chunks
    chunk_count: int            # total number of chunks


# ---------------------------------------------------------------------------
# Core chunking function
# ---------------------------------------------------------------------------

def chunk_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> ChunkResult:
    """
    Split document text into overlapping chunks.

    Args:
        text:          Full extracted document text.
        chunk_size:    Target max character length per chunk (default 1000).
        chunk_overlap: Characters shared between adjacent chunks (default 200).
                       Overlap helps the model see cross-boundary context.

    Returns:
        ChunkResult with the list of chunks and their count.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        # Try paragraph breaks first, then sentences, then words, then chars
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
    )

    chunks = splitter.split_text(text)

    # Filter out purely whitespace chunks
    chunks = [c.strip() for c in chunks if c.strip()]

    return ChunkResult(chunks=chunks, chunk_count=len(chunks))
