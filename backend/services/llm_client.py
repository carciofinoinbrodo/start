"""
LLM Client for generating AI-powered SEO suggestions.
Supports both Claude (Anthropic) and GPT (OpenAI) with automatic fallback.
Uses prompt caching for Claude to reduce costs by 90%.
"""
import os
import json
import logging
import asyncio
import random
from typing import Optional, Type, TypeVar
from datetime import datetime
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

# Try importing both providers
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    anthropic = None

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

# Configuration
MAX_RETRIES = 4
BASE_DELAY = 0.5

# Model names (2026)
CLAUDE_MODEL = os.getenv("LLM_MODEL_CLAUDE", "claude-sonnet-4-5-20250929")
OPENAI_MODEL = os.getenv("LLM_MODEL_OPENAI", "gpt-4o")  # Fallback to gpt-4o if gpt-5 not available

T = TypeVar('T', bound=BaseModel)


class LLMRateLimitError(Exception):
    """Raised when rate limits are exceeded after all retries"""
    pass


class LLMClient:
    """
    Unified LLM client with Claude + OpenAI support.

    Features:
    - Automatic provider fallback on failure
    - Exponential backoff with jitter for retries
    - Prompt caching for Claude (90% cost reduction)
    - Structured output validation with Pydantic
    """

    def __init__(self):
        self.anthropic_client = None
        self.openai_client = None
        self.primary_provider = os.getenv("LLM_PRIMARY_PROVIDER", "anthropic")

        # Initialize Anthropic
        if ANTHROPIC_AVAILABLE:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if api_key:
                self.anthropic_client = anthropic.Anthropic(api_key=api_key)
                logger.info("Anthropic client initialized")
            else:
                logger.warning("ANTHROPIC_API_KEY not set")

        # Initialize OpenAI
        if OPENAI_AVAILABLE:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
                logger.info("OpenAI client initialized")
            else:
                logger.warning("OPENAI_API_KEY not set")

    def is_available(self) -> bool:
        """Check if at least one LLM provider is available"""
        return self.anthropic_client is not None or self.openai_client is not None

    async def generate_structured_output(
        self,
        analysis_context: str,
        brand_context: str,
        output_schema: Type[T],
        provider: Optional[str] = None
    ) -> T:
        """
        Generate structured output using LLM with automatic fallback.

        Args:
            analysis_context: Dynamic analysis data (changes per request)
            brand_context: Static brand context (cached for cost reduction)
            output_schema: Pydantic model class for validation
            provider: Force specific provider ('anthropic' or 'openai')

        Returns:
            Validated Pydantic model instance

        Raises:
            LLMRateLimitError: If all providers and retries fail
        """
        provider = provider or self.primary_provider
        providers_to_try = [provider]

        # Add fallback provider
        if provider == "anthropic" and self.openai_client:
            providers_to_try.append("openai")
        elif provider == "openai" and self.anthropic_client:
            providers_to_try.append("anthropic")

        last_error = None
        for current_provider in providers_to_try:
            try:
                if current_provider == "anthropic" and self.anthropic_client:
                    return await self._call_claude_with_retry(
                        analysis_context, brand_context, output_schema
                    )
                elif current_provider == "openai" and self.openai_client:
                    return await self._call_openai_with_retry(
                        analysis_context, brand_context, output_schema
                    )
            except LLMRateLimitError as e:
                logger.warning(f"{current_provider} failed: {e}, trying fallback...")
                last_error = e
                continue
            except Exception as e:
                logger.error(f"Unexpected error with {current_provider}: {e}")
                last_error = e
                continue

        raise LLMRateLimitError(f"All providers failed. Last error: {last_error}")

    async def _call_claude_with_retry(
        self,
        analysis_context: str,
        brand_context: str,
        schema: Type[T]
    ) -> T:
        """Call Claude with retry logic and prompt caching"""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return await self._call_claude(analysis_context, brand_context, schema)
            except anthropic.RateLimitError as e:
                if attempt == MAX_RETRIES:
                    raise LLMRateLimitError(f"Claude rate limit exceeded: {e}")
                delay = self._calculate_delay(attempt)
                logger.warning(f"Claude rate limited, retry {attempt}/{MAX_RETRIES} in {delay:.1f}s")
                await asyncio.sleep(delay)
            except anthropic.APIConnectionError as e:
                if attempt == MAX_RETRIES:
                    raise LLMRateLimitError(f"Claude connection error: {e}")
                delay = self._calculate_delay(attempt)
                await asyncio.sleep(delay)

    async def _call_openai_with_retry(
        self,
        analysis_context: str,
        brand_context: str,
        schema: Type[T]
    ) -> T:
        """Call OpenAI with retry logic"""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return await self._call_openai(analysis_context, brand_context, schema)
            except Exception as e:
                if "rate" in str(e).lower() or "429" in str(e):
                    if attempt == MAX_RETRIES:
                        raise LLMRateLimitError(f"OpenAI rate limit exceeded: {e}")
                    delay = self._calculate_delay(attempt)
                    logger.warning(f"OpenAI rate limited, retry {attempt}/{MAX_RETRIES} in {delay:.1f}s")
                    await asyncio.sleep(delay)
                else:
                    raise

    async def _call_claude(
        self,
        analysis_context: str,
        brand_context: str,
        schema: Type[T]
    ) -> T:
        """
        Call Claude with structured output and prompt caching.

        Uses cache_control for the brand_context to reduce costs by 90%
        when the same brand is analyzed multiple times.
        """
        schema_json = json.dumps(schema.model_json_schema(), indent=2)

        # Build system message with caching for static content
        system_content = [
            {
                "type": "text",
                "text": brand_context,
                "cache_control": {"type": "ephemeral"}  # 90% cheaper on cache hits!
            },
            {
                "type": "text",
                "text": """You are an expert SEO and GEO (Generative Engine Optimization) analyst
specializing in AI search visibility. You analyze brand performance in AI-generated
search results and provide actionable, data-driven recommendations.

Your recommendations should focus on:
1. Share of Synthesis - Being the primary cited source
2. Vector Density - Using specific entities and terminology
3. E-E-A-T Evidence - Demonstrating expertise and trustworthiness
4. Authority Signals - Getting mentioned by high-authority sources
5. Answer-First Content - Clear, extractable summaries

Provide specific, implementable actions with clear steps."""
            }
        ]

        user_content = f"""Analyze the following data and generate SEO recommendations.

Return your response as valid JSON matching this schema:
{schema_json}

Analysis Data:
{analysis_context}

Important:
- Generate 3-7 keyword opportunities based on the data
- Generate 3-10 on-page recommendations with implementation steps
- Set generated_at to the current UTC timestamp
- Set model_used to "{CLAUDE_MODEL}"
- Be specific and data-driven, not generic

Return ONLY valid JSON, no markdown code blocks or explanation."""

        # Make the API call
        response = self.anthropic_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=system_content,
            messages=[{"role": "user", "content": user_content}]
        )

        # Extract and validate response
        raw_text = response.content[0].text

        # Clean up response if it has markdown code blocks
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        try:
            return schema.model_validate_json(raw_text)
        except ValidationError as e:
            logger.error(f"Claude response validation failed: {e}")
            logger.debug(f"Raw response: {raw_text[:500]}...")
            raise

    async def _call_openai(
        self,
        analysis_context: str,
        brand_context: str,
        schema: Type[T]
    ) -> T:
        """Call OpenAI with structured output (JSON mode)"""
        schema_json = json.dumps(schema.model_json_schema(), indent=2)

        system_message = f"""{brand_context}

You are an expert SEO and GEO analyst specializing in AI search visibility.
Provide actionable, data-driven recommendations based on the analysis data.

Your response must be valid JSON matching this schema:
{schema_json}"""

        user_message = f"""Analyze the following data and generate SEO recommendations:

{analysis_context}

Important:
- Generate 3-7 keyword opportunities
- Generate 3-10 on-page recommendations with implementation steps
- Set generated_at to "{datetime.utcnow().isoformat()}"
- Set model_used to "{OPENAI_MODEL}"

Return ONLY valid JSON."""

        response = self.openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=4096
        )

        raw_text = response.choices[0].message.content

        try:
            return schema.model_validate_json(raw_text)
        except ValidationError as e:
            logger.error(f"OpenAI response validation failed: {e}")
            logger.debug(f"Raw response: {raw_text[:500]}...")
            raise

    def _calculate_delay(self, attempt: int) -> float:
        """Calculate delay with exponential backoff and jitter"""
        delay = BASE_DELAY * (2 ** (attempt - 1))
        jitter = 0.7 + 0.6 * random.random()
        return delay * jitter
