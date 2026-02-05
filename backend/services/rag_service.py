"""
RAG (Retrieval-Augmented Generation) Service for AI Suggestions.
Uses pgvector for semantic similarity search over prompt embeddings.
"""
import logging
from collections import Counter
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select, text

from models import Brand, Prompt, PromptBrandMention, Source, PromptSource
from database import IS_POSTGRES, is_vector_search_available
from .embeddings import EmbeddingService

logger = logging.getLogger(__name__)


class RAGService:
    """
    Service for RAG-based context retrieval.

    Features:
    - Vector similarity search using pgvector
    - Fallback to recent prompts when vector search unavailable
    - Context building for LLM prompts (with caching support)
    """

    def __init__(self, session: Session, embedding_service: Optional[EmbeddingService] = None):
        self.session = session
        self.embedding_service = embedding_service or EmbeddingService()
        self._vector_search_available = None

    @property
    def vector_search_available(self) -> bool:
        """Check if vector search is available (cached)"""
        if self._vector_search_available is None:
            self._vector_search_available = (
                IS_POSTGRES and
                is_vector_search_available() and
                self.embedding_service.is_available()
            )
        return self._vector_search_available

    async def find_similar_prompts(
        self,
        query: str,
        brand_id: Optional[str] = None,
        limit: int = 10
    ) -> list[Prompt]:
        """
        Find prompts similar to the query using vector search.

        Falls back to recent prompts if vector search is unavailable.

        Args:
            query: Search query for similarity
            brand_id: Optional brand to filter by
            limit: Maximum number of results

        Returns:
            List of similar Prompt objects
        """
        if self.vector_search_available:
            return await self._vector_search(query, brand_id, limit)
        else:
            logger.info("Vector search unavailable, falling back to recent prompts")
            return self._fallback_recent_prompts(brand_id, limit)

    async def _vector_search(
        self,
        query: str,
        brand_id: Optional[str],
        limit: int
    ) -> list[Prompt]:
        """Perform vector similarity search using pgvector"""
        # Generate embedding for the query
        query_embedding = await self.embedding_service.embed_text(query)
        if query_embedding is None:
            logger.warning("Failed to generate query embedding, using fallback")
            return self._fallback_recent_prompts(brand_id, limit)

        # Build the similarity search query
        # pgvector uses <=> for cosine distance (lower = more similar)
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        sql = f"""
            SELECT p.id, p.query, p.run_number, p.response_text, p.scraped_at,
                   pe.embedding <=> '{embedding_str}'::vector AS distance
            FROM prompt p
            JOIN promptembedding pe ON p.id = pe.prompt_id
            WHERE pe.embedding IS NOT NULL
        """

        if brand_id:
            sql += f"""
                AND EXISTS (
                    SELECT 1 FROM promptbrandmention m
                    WHERE m.prompt_id = p.id
                    AND m.brand_id = '{brand_id}'
                )
            """

        sql += f" ORDER BY distance ASC LIMIT {limit}"

        try:
            result = self.session.exec(text(sql))
            rows = result.fetchall()

            # Convert to Prompt objects
            prompts = []
            for row in rows:
                prompt = Prompt(
                    id=row[0],
                    query=row[1],
                    run_number=row[2],
                    response_text=row[3],
                    scraped_at=row[4]
                )
                prompts.append(prompt)

            logger.info(f"Vector search found {len(prompts)} similar prompts")
            return prompts

        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return self._fallback_recent_prompts(brand_id, limit)

    def _fallback_recent_prompts(
        self,
        brand_id: Optional[str],
        limit: int
    ) -> list[Prompt]:
        """Fallback: return most recent prompts"""
        query = select(Prompt).order_by(Prompt.scraped_at.desc()).limit(limit)

        if brand_id:
            query = (
                select(Prompt)
                .join(PromptBrandMention)
                .where(PromptBrandMention.brand_id == brand_id)
                .order_by(Prompt.scraped_at.desc())
                .limit(limit)
            )

        return list(self.session.exec(query).all())

    def build_brand_context(self, brand: Brand, metrics: dict) -> str:
        """
        Build STATIC brand context for prompt caching.

        This context is cached by Claude, reducing costs by 90%
        when the same brand is analyzed multiple times.

        Args:
            brand: The brand being analyzed
            metrics: Brand performance metrics

        Returns:
            Static context string for caching
        """
        brand_type_desc = "Your brand (primary)" if brand.type == "primary" else "Competitor"

        return f"""# Brand Profile (Static Context)

## Brand: {brand.name}
- Type: {brand_type_desc}
- Search Variations: {brand.variations or brand.name}
- Industry: E-commerce platforms

## Competitor Landscape
The main competitors in this space are:
- Shopify (leading market share)
- WooCommerce (open-source WordPress plugin)
- BigCommerce (enterprise-focused)
- Squarespace (design-focused)
- Wix (ease-of-use focused)

## GEO Optimization Framework (2026 Best Practices)
Focus on these key ranking factors for AI search visibility:

1. **Share of Synthesis** - Be the primary cited source in AI responses
   - Create Answer-First content with 50-word direct summaries
   - Structure content for easy AI extraction

2. **Vector Density** - Semantic closeness to queries
   - Use specific entities and terminology
   - Avoid generic marketing language

3. **E-E-A-T Evidence** - Demonstrable expertise
   - Link Product schemas to Reviews and Author profiles
   - Showcase real user testimonials and case studies

4. **Authority Signals** - Third-party validation
   - Get mentioned in industry publications
   - Appear in high-authority listicles and reviews

5. **Technical GEO** - AI-friendly infrastructure
   - Enable llms.txt for AI crawlers
   - Use proper schema markup (FAQ, HowTo, Product)
"""

    def build_analysis_context(
        self,
        brand: Brand,
        similar_prompts: list[Prompt],
        metrics: dict
    ) -> str:
        """
        Build DYNAMIC analysis context (changes per request).

        Args:
            brand: The brand being analyzed
            similar_prompts: Similar prompts from RAG retrieval
            metrics: Current performance metrics

        Returns:
            Dynamic context string with current data
        """
        now = datetime.utcnow().isoformat()

        # Format competitor comparison
        competitors_text = self._format_competitors(metrics.get('competitors', []))

        # Format similar prompts
        prompts_text = self._format_prompts(similar_prompts)

        return f"""# Current Analysis Data

## Analysis Timestamp
{now}

## Live Metrics for {brand.name}
- AI Visibility Score: {metrics.get('visibility', 0):.1f}%
- Average Citation Position: {metrics.get('avg_position', 0):.1f}
- Total AI Mentions: {metrics.get('total_mentions', 0)}
- Month-over-Month Trend: {metrics.get('trend', 'stable')}
- Primary Sentiment: {metrics.get('sentiment', 'neutral')}

## Competitor Comparison
{competitors_text}

## Source Type Distribution
| Type | Percentage | Description |
|------|------------|-------------|
| Blog | {metrics.get('blog_pct', 0)}% | Blog posts and articles |
| Community | {metrics.get('community_pct', 0)}% | Reddit, forums, Q&A |
| News | {metrics.get('news_pct', 0)}% | Industry publications |
| Review | {metrics.get('review_pct', 0)}% | G2, Capterra, etc. |

## Similar AI Responses (RAG Retrieved - {len(similar_prompts)} most relevant)
{prompts_text}

## Analysis Task
Based on this data, analyze where {brand.name} is under-performing in AI search visibility.

Provide:
1. **3-7 keyword/topic opportunities** where the brand could gain more AI citations
2. **3-10 prioritized recommendations** with specific implementation steps
3. Focus on actionable, data-driven insights - not generic SEO advice

Consider:
- Which query types is {brand.name} missing from?
- What sources are being cited that {brand.name} is not present in?
- What sentiment issues need to be addressed?
- What technical improvements would help AI extractability?
"""

    def _format_competitors(self, competitors: list[dict]) -> str:
        """Format competitor data for the prompt"""
        if not competitors:
            return "No competitor data available."

        lines = ["| Brand | Visibility | Position | Trend |",
                 "|-------|------------|----------|-------|"]

        for comp in competitors:
            lines.append(
                f"| {comp.get('name', 'Unknown')} | "
                f"{comp.get('visibility', 0):.1f}% | "
                f"{comp.get('avg_position', 0):.1f} | "
                f"{comp.get('trend', 'stable')} |"
            )

        return "\n".join(lines)

    def _format_prompts(self, prompts: list[Prompt]) -> str:
        """Format similar prompts for the context"""
        if not prompts:
            return "No similar prompts found."

        lines = []
        for i, prompt in enumerate(prompts[:5], 1):  # Limit to 5 for context size
            response_preview = ""
            if prompt.response_text:
                # Truncate long responses
                response_preview = prompt.response_text[:300]
                if len(prompt.response_text) > 300:
                    response_preview += "..."

            lines.append(f"""
### Prompt {i}: "{prompt.query}"
**Scraped:** {prompt.scraped_at.strftime('%Y-%m-%d') if prompt.scraped_at else 'Unknown'}
**Response Preview:** {response_preview}
""")

        return "\n".join(lines)

    def calculate_brand_metrics(self, brand_id: str) -> dict:
        """
        Calculate comprehensive metrics for a brand.

        Args:
            brand_id: The brand ID to analyze

        Returns:
            Dictionary with all relevant metrics
        """
        from collections import Counter

        # Get all prompts
        all_prompts = list(self.session.exec(select(Prompt)).all())

        # Get brand mentions
        mentions = list(self.session.exec(
            select(PromptBrandMention)
            .where(PromptBrandMention.brand_id == brand_id)
        ).all())

        # Calculate visibility (% of prompts mentioning this brand)
        mentioned_prompt_ids = {m.prompt_id for m in mentions if m.mentioned}
        total_unique_queries = len(set(p.query for p in all_prompts))
        mentioned_queries = len(set(
            p.query for p in all_prompts if p.id in mentioned_prompt_ids
        ))
        visibility = (mentioned_queries / total_unique_queries * 100) if total_unique_queries > 0 else 0

        # Calculate average position
        positions = [m.position for m in mentions if m.mentioned and m.position]
        avg_position = sum(positions) / len(positions) if positions else 0

        # Calculate sentiment distribution
        sentiments = [m.sentiment for m in mentions if m.mentioned and m.sentiment]
        sentiment_counts = Counter(sentiments)
        primary_sentiment = sentiment_counts.most_common(1)[0][0] if sentiment_counts else "neutral"

        # Calculate trend (simplified - compare recent vs older)
        # In production, this would use proper time-series analysis
        trend = "stable"

        # Get source type distribution
        sources = list(self.session.exec(select(Source)).all())
        source_types = self._classify_sources(sources)

        # Get competitor metrics
        competitors = self._get_competitor_metrics(brand_id)

        return {
            "visibility": visibility,
            "avg_position": avg_position,
            "total_mentions": len([m for m in mentions if m.mentioned]),
            "sentiment": primary_sentiment,
            "trend": trend,
            "blog_pct": source_types.get("blog", 0),
            "community_pct": source_types.get("community", 0),
            "news_pct": source_types.get("news", 0),
            "review_pct": source_types.get("review", 0),
            "competitors": competitors
        }

    def _classify_sources(self, sources: list[Source]) -> dict[str, float]:
        """Classify sources by type and return percentages"""
        if not sources:
            return {}

        type_counts = Counter()
        for source in sources:
            source_type = self._get_source_type(source.domain, source.url)
            type_counts[source_type] += 1

        total = len(sources)
        return {
            source_type: round(count / total * 100, 1)
            for source_type, count in type_counts.items()
        }

    def _get_source_type(self, domain: str, url: str) -> str:
        """Determine the type of a source based on domain/URL"""
        domain_lower = domain.lower() if domain else ""
        url_lower = url.lower() if url else ""

        if '/blog/' in url_lower or 'blog' in domain_lower:
            return 'blog'
        if any(x in domain_lower for x in ['reddit', 'quora', 'stackoverflow', 'discourse']):
            return 'community'
        if any(x in domain_lower for x in ['forbes', 'techcrunch', 'entrepreneur', 'businessinsider']):
            return 'news'
        if any(x in domain_lower for x in ['g2.com', 'capterra', 'trustpilot']):
            return 'review'
        return 'other'

    def _get_competitor_metrics(self, exclude_brand_id: str) -> list[dict]:
        """Get metrics for competitor brands"""
        brands = list(self.session.exec(
            select(Brand).where(Brand.id != exclude_brand_id)
        ).all())

        competitors = []
        for brand in brands[:5]:  # Limit to top 5 competitors
            # Simplified metrics calculation
            mentions = list(self.session.exec(
                select(PromptBrandMention)
                .where(PromptBrandMention.brand_id == brand.id)
                .where(PromptBrandMention.mentioned == True)
            ).all())

            all_prompts = list(self.session.exec(select(Prompt)).all())
            total_queries = len(set(p.query for p in all_prompts))
            mentioned_queries = len(set(m.prompt_id for m in mentions))

            visibility = (mentioned_queries / total_queries * 100) if total_queries > 0 else 0
            positions = [m.position for m in mentions if m.position]
            avg_position = sum(positions) / len(positions) if positions else 0

            competitors.append({
                "id": brand.id,
                "name": brand.name,
                "visibility": visibility,
                "avg_position": avg_position,
                "trend": "stable"
            })

        return sorted(competitors, key=lambda x: x["visibility"], reverse=True)
