"""
services/retrieval.py
─────────────────────
Full RAG (Retrieval-Augmented Generation) pipeline.

Flow:
  1. Encode the user's question via FAISS similarity search
  2. Retrieve the top-k most relevant text chunks
  3. Build a prompt that includes those chunks as context
  4. Call the OpenAI chat model to generate a grounded answer
  5. Return the answer + source excerpts for transparency

The model is intentionally instructed to ONLY use the provided context.
This keeps answers grounded in the uploaded PDF and avoids hallucination.
"""

import os
from dataclasses import dataclass, field

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from services.embeddings import get_vector_store


# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_RAG_PROMPT = ChatPromptTemplate.from_template(
    """You are a helpful AI assistant that answers questions STRICTLY based on the
provided PDF document context below. Follow these rules:
- Only use information from the context to answer.
- If the answer is not present in the context, say exactly:
  "I couldn't find that information in the uploaded PDF."
- Be concise and accurate.
- When possible, quote or reference specific parts of the document.
- Do NOT use any external knowledge or make things up.

─────────────────────────────
Context extracted from the PDF:
{context}
─────────────────────────────

User question: {question}

Answer:"""
)


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class RAGResult:
    """Structured output from the RAG pipeline."""
    answer: str                         # LLM-generated answer
    sources: list[str] = field(default_factory=list)  # source chunk excerpts
    chunks_used: int = 0                # number of retrieved chunks


# ---------------------------------------------------------------------------
# Core RAG function
# ---------------------------------------------------------------------------

def answer_question(
    file_id: str,
    question: str,
    top_k: int = 4,
) -> RAGResult:
    """
    Answer a question about an uploaded PDF using RAG.

    Steps:
        1. Look up the FAISS vector store for file_id.
        2. Encode the question and retrieve top_k similar chunks.
        3. Combine chunks into a context string.
        4. Feed context + question into the LLM via the RAG prompt.
        5. Return the answer and source excerpts.

    Args:
        file_id:  UUID returned by the /upload endpoint.
        question: The user's natural language question.
        top_k:    Number of document chunks to retrieve (default 4).

    Returns:
        RAGResult with the generated answer and source excerpts.

    Raises:
        ValueError:  If no vector store exists for the given file_id.
        EnvironmentError: If OPENAI_API_KEY is not set.
    """
    # --- 1. Retrieve the vector store ---
    vector_store = get_vector_store(file_id)
    if not vector_store:
        raise ValueError(
            f"No vector store found for file_id '{file_id}'. "
            "Please re-upload the PDF."
        )

    # --- 2. Similarity search – find the most relevant chunks ---
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": top_k},
    )
    relevant_docs = retriever.invoke(question)

    if not relevant_docs:
        return RAGResult(
            answer="I couldn't find relevant information in the uploaded PDF.",
            sources=[],
            chunks_used=0,
        )

    # --- 3. Build context from retrieved chunks ---
    context = "\n\n---\n\n".join(doc.page_content for doc in relevant_docs)

    # Short excerpts for the "sources" field in the API response
    source_excerpts = [
        doc.page_content[:300].strip() + ("..." if len(doc.page_content) > 300 else "")
        for doc in relevant_docs
    ]

    # --- 4. Build and run the LLM chain ---
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise EnvironmentError(
            "OPENAI_API_KEY is not set. Add it to your .env file."
        )

    llm = ChatOpenAI(
        model="gpt-4o-mini",     # lightweight, fast, cost-effective
        temperature=0,           # deterministic answers
        openai_api_key=api_key,
    )

    # Chain: format prompt → LLM → extract string output
    chain = _RAG_PROMPT | llm | StrOutputParser()

    answer = chain.invoke({"context": context, "question": question})

    # --- 5. Return structured result ---
    return RAGResult(
        answer=answer.strip(),
        sources=source_excerpts,
        chunks_used=len(relevant_docs),
    )
