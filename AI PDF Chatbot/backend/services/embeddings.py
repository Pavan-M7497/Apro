"""
services/embeddings.py
──────────────────────
Handles OpenAI embedding generation and FAISS vector-store management.

Architecture decision: vector stores are kept in-process memory (a plain dict)
keyed by file_id.  This is intentionally simple for a single-server demo.
For multi-process / multi-server deployments you would persist the FAISS index
to disk or use a managed vector DB (Pinecone, Weaviate, etc.).
"""

import os
from typing import Optional

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document


# ---------------------------------------------------------------------------
# In-memory store  { file_id -> FAISS vector store }
# ---------------------------------------------------------------------------

_vector_stores: dict[str, FAISS] = {}


# ---------------------------------------------------------------------------
# Helper – embeddings model
# ---------------------------------------------------------------------------

def _get_embeddings() -> OpenAIEmbeddings:
    """
    Return an OpenAI embeddings model.
    Reads OPENAI_API_KEY from the environment (loaded by python-dotenv).
    """
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise EnvironmentError(
            "OPENAI_API_KEY is not set. "
            "Create a .env file with OPENAI_API_KEY=<your-key>."
        )
    return OpenAIEmbeddings(
        model="text-embedding-3-small",   # fast, cheap, accurate
        openai_api_key=api_key,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_vector_store(file_id: str, chunks: list[str]) -> int:
    """
    Embed all text chunks and store the resulting FAISS index in memory.

    Args:
        file_id: Unique identifier for the PDF session.
        chunks:  List of text chunks from the chunker.

    Returns:
        Number of vectors stored.

    Raises:
        EnvironmentError: If OPENAI_API_KEY is missing.
        Exception:        If the OpenAI API call fails.
    """
    embeddings = _get_embeddings()

    # Wrap raw strings in LangChain Document objects so we can attach metadata
    documents = [
        Document(
            page_content=chunk,
            metadata={"chunk_index": i, "file_id": file_id},
        )
        for i, chunk in enumerate(chunks)
    ]

    # Build FAISS index – this calls the OpenAI embeddings API in one batch
    vector_store = FAISS.from_documents(documents, embeddings)

    # Cache the index in memory
    _vector_stores[file_id] = vector_store

    return len(documents)


def get_vector_store(file_id: str) -> Optional[FAISS]:
    """Retrieve the FAISS vector store for a given file_id, or None."""
    return _vector_stores.get(file_id)


def delete_vector_store(file_id: str) -> bool:
    """Remove a vector store from memory (e.g. when a user starts a new session)."""
    if file_id in _vector_stores:
        del _vector_stores[file_id]
        return True
    return False
