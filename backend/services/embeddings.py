"""
Embedding Service for generating vector embeddings of text.
Uses OpenAI's text-embedding-3-large model (3072 dimensions).
"""
import os
import logging
import asyncio
from typing import Optional
from openai import OpenAI, RateLimitError, APIConnectionError

logger = logging.getLogger(__name__)

# Embedding model configuration
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 3072

# Retry configuration
MAX_RETRIES = 3
BASE_DELAY = 1.0


class EmbeddingService:
    """Service for generating text embeddings using OpenAI API"""

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set - embedding features will not work")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)

    def is_available(self) -> bool:
        """Check if the embedding service is available"""
        return self.client is not None

    async def embed_text(self, text: str) -> Optional[list[float]]:
        """
        Generate embedding for a single text string.

        Args:
            text: The text to embed (max ~8000 tokens)

        Returns:
            List of floats (embedding vector) or None if failed
        """
        if not self.client:
            logger.error("OpenAI client not initialized")
            return None

        # Truncate very long text to avoid token limits
        max_chars = 30000  # Roughly ~8000 tokens
        if len(text) > max_chars:
            text = text[:max_chars]
            logger.warning(f"Text truncated to {max_chars} characters for embedding")

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = self.client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=text,
                    dimensions=EMBEDDING_DIMENSIONS
                )
                return response.data[0].embedding

            except RateLimitError as e:
                if attempt == MAX_RETRIES:
                    logger.error(f"Rate limit exceeded after {MAX_RETRIES} retries: {e}")
                    return None
                delay = BASE_DELAY * (2 ** (attempt - 1))
                logger.warning(f"Rate limited, retrying in {delay}s...")
                await asyncio.sleep(delay)

            except APIConnectionError as e:
                if attempt == MAX_RETRIES:
                    logger.error(f"API connection error after {MAX_RETRIES} retries: {e}")
                    return None
                delay = BASE_DELAY * (2 ** (attempt - 1))
                logger.warning(f"Connection error, retrying in {delay}s...")
                await asyncio.sleep(delay)

            except Exception as e:
                logger.error(f"Unexpected error generating embedding: {e}")
                return None

        return None

    async def embed_texts(self, texts: list[str]) -> list[Optional[list[float]]]:
        """
        Generate embeddings for multiple texts in batch.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors (or None for failed embeddings)
        """
        if not self.client:
            logger.error("OpenAI client not initialized")
            return [None] * len(texts)

        if not texts:
            return []

        # OpenAI supports batch embedding, but we'll process in chunks
        # to handle rate limits better
        BATCH_SIZE = 100
        results = []

        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i:i + BATCH_SIZE]

            # Truncate long texts
            batch = [t[:30000] if len(t) > 30000 else t for t in batch]

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    response = self.client.embeddings.create(
                        model=EMBEDDING_MODEL,
                        input=batch,
                        dimensions=EMBEDDING_DIMENSIONS
                    )
                    # Extract embeddings in order
                    batch_results = [None] * len(batch)
                    for item in response.data:
                        batch_results[item.index] = item.embedding
                    results.extend(batch_results)
                    break

                except RateLimitError as e:
                    if attempt == MAX_RETRIES:
                        logger.error(f"Rate limit exceeded for batch: {e}")
                        results.extend([None] * len(batch))
                        break
                    delay = BASE_DELAY * (2 ** (attempt - 1))
                    await asyncio.sleep(delay)

                except Exception as e:
                    logger.error(f"Error embedding batch: {e}")
                    results.extend([None] * len(batch))
                    break

            # Small delay between batches to avoid rate limits
            if i + BATCH_SIZE < len(texts):
                await asyncio.sleep(0.5)

        return results

    async def embed_prompt(self, query: str, response_text: str) -> Optional[list[float]]:
        """
        Generate embedding for a prompt (combining query and response).

        Args:
            query: The search query
            response_text: The AI response text

        Returns:
            Embedding vector or None if failed
        """
        # Combine query and response for richer semantic embedding
        combined_text = f"Query: {query}\n\nAI Response: {response_text}"
        return await self.embed_text(combined_text)
