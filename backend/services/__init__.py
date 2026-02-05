# AI Services for SEO Suggestions
# These are imported lazily to handle missing dependencies gracefully

__all__ = ["EmbeddingService", "LLMClient", "RAGService"]


def __getattr__(name):
    """Lazy import to handle missing dependencies"""
    if name == "EmbeddingService":
        from .embeddings import EmbeddingService
        return EmbeddingService
    elif name == "LLMClient":
        from .llm_client import LLMClient
        return LLMClient
    elif name == "RAGService":
        from .rag_service import RAGService
        return RAGService
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
