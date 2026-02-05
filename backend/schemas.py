from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class BrandResponse(BaseModel):
    """Brand with computed metrics"""
    id: str
    name: str
    type: str
    color: str
    visibility: float  # % of prompts mentioning this brand
    avgPosition: float  # Average position when mentioned
    trend: str  # 'up', 'down', 'stable'
    sentiment: str  # Most common sentiment


class PromptBrandMentionResponse(BaseModel):
    """Brand mention in a prompt"""
    brandId: str
    brandName: str
    position: int
    mentioned: bool
    sentiment: str


class SourceInPromptResponse(BaseModel):
    """Source as it appears in a prompt"""
    domain: str
    url: str
    title: str | None
    description: str | None
    publishedDate: str | None
    citationOrder: int


class RunResponse(BaseModel):
    """A single run/scrape of a prompt"""
    id: int
    runNumber: int
    scrapedAt: str
    visibility: float
    avgPosition: float
    totalMentions: int
    brands: list[PromptBrandMentionResponse]
    responseText: str | None
    sources: list[SourceInPromptResponse]


class PromptResponse(BaseModel):
    """Prompt with aggregated stats across all runs"""
    id: str
    query: str
    visibility: float  # Average across runs
    avgPosition: float  # Average across runs
    totalMentions: int  # Average across runs
    totalRuns: int
    brands: list[PromptBrandMentionResponse]  # Aggregated from latest run


class PromptDetailResponse(PromptResponse):
    """Detailed prompt with all runs"""
    runs: list[RunResponse]


class SourceResponse(BaseModel):
    """Source with computed metrics"""
    domain: str
    usage: float  # % of prompts citing this source
    avgCitations: float  # Average citation position


class MetricResponse(BaseModel):
    """Dashboard metric"""
    value: float | int
    change: float
    total: int | None = None


class DashboardMetricsResponse(BaseModel):
    """All dashboard KPIs"""
    visibility: MetricResponse
    totalPrompts: MetricResponse
    totalSources: MetricResponse
    avgPosition: MetricResponse


class DailyVisibilityResponse(BaseModel):
    """Daily visibility data for charts"""
    date: str
    shopify: float | None = None
    woocommerce: float | None = None
    bigcommerce: float | None = None
    wix: float | None = None
    squarespace: float | None = None


# Sources Analytics schemas
class DomainBreakdown(BaseModel):
    """Domain with citation stats"""
    domain: str
    citations: int
    percentage: float
    type: str  # 'brand', 'blog', 'community', 'news', 'official', 'other'


class SourceType(BaseModel):
    """Source type breakdown"""
    type: str
    count: int
    percentage: float


class TopSource(BaseModel):
    """Top source with detailed info"""
    id: int
    domain: str
    url: str
    title: str | None
    citations: int
    prompts: list[str]


class SourcesSummary(BaseModel):
    """Summary stats for sources"""
    totalSources: int
    totalDomains: int
    totalCitations: int
    avgCitationsPerSource: float


class SourcesAnalyticsResponse(BaseModel):
    """Full sources analytics response"""
    summary: SourcesSummary
    domainBreakdown: list[DomainBreakdown]
    sourceTypes: list[SourceType]
    topSources: list[TopSource]


# Suggestions schemas
class SuggestionExample(BaseModel):
    """Example source or prompt for a suggestion"""
    type: str  # 'source' or 'prompt'
    domain: str | None = None
    title: str | None = None
    query: str | None = None


class Suggestion(BaseModel):
    """AI SEO improvement suggestion"""
    id: int
    priority: str  # 'high', 'medium', 'low'
    category: str  # 'content', 'community', 'authority', 'technical'
    title: str
    description: str
    stat: str
    statLabel: str
    action: str
    examples: list[SuggestionExample]


class SuggestionsResponse(BaseModel):
    """Suggestions with overall score"""
    score: int
    suggestions: list[Suggestion]


# Brand Management schemas
class BrandCreate(BaseModel):
    """Create a new brand"""
    id: str  # lowercase, no spaces (e.g., "adobe-commerce")
    name: str
    type: str = "competitor"  # 'primary' or 'competitor'
    color: str
    variations: list[str] = []  # Search terms: ["Adobe Commerce", "Magento"]


class BrandPromptDetail(BaseModel):
    """Prompt detail for brand analytics"""
    query: str
    position: int | None
    sentiment: str | None
    scrapedAt: str


class BrandMonthlyVisibility(BaseModel):
    """Monthly visibility data for brand"""
    month: str
    visibility: float


class BrandDetailResponse(BaseModel):
    """Detailed brand analytics"""
    id: str
    name: str
    type: str
    color: str
    variations: list[str]
    visibility: float
    avgPosition: float
    trend: str
    sentiment: str
    totalMentions: int
    totalPrompts: int
    topPrompts: list[BrandPromptDetail]
    visibilityByMonth: list[BrandMonthlyVisibility]


class BrandListResponse(BaseModel):
    """List of all brands with details"""
    brands: list[BrandDetailResponse]


# --- AI-Generated Suggestions Schemas (for LLM structured output) ---

class KeywordOpportunity(BaseModel):
    """A keyword/topic opportunity identified by AI analysis"""
    query: str = Field(description="The keyword or topic query")
    intent: Literal["informational", "commercial", "navigational"] = Field(
        description="User intent behind this query"
    )
    difficulty: Literal["low", "medium", "high"] = Field(
        description="Estimated difficulty to rank for this query"
    )
    estimated_impact: Literal["low", "medium", "high"] = Field(
        description="Expected impact on AI visibility if optimized"
    )
    rationale: str = Field(
        description="Data-driven explanation for why this opportunity exists"
    )


class OnPageRecommendation(BaseModel):
    """An actionable SEO/GEO recommendation"""
    page_url: str = Field(
        description="Target page URL or '*' for site-wide recommendations"
    )
    priority: Literal["low", "medium", "high"] = Field(
        description="Implementation priority"
    )
    change_type: Literal["content", "technical", "authority", "sentiment"] = Field(
        description="Category of change required"
    )
    recommendation: str = Field(
        description="Clear, specific recommendation"
    )
    implementation_steps: list[str] = Field(
        description="Step-by-step implementation guide"
    )


class AISuggestionsResponse(BaseModel):
    """
    Structured output schema for AI-generated SEO suggestions.
    This schema is passed to Claude/GPT for structured output generation.
    """
    brand: str = Field(description="Brand being analyzed")
    ai_visibility_score: float = Field(
        ge=0, le=100,
        description="Overall AI visibility score (0-100)"
    )
    summary: str = Field(
        description="2-3 sentence executive summary of AI visibility status and key findings"
    )
    keyword_opportunities: list[KeywordOpportunity] = Field(
        description="3-7 keyword/topic opportunities for improved AI citations"
    )
    on_page_recommendations: list[OnPageRecommendation] = Field(
        description="3-10 prioritized on-page and off-page action items"
    )
    competitor_insights: str | None = Field(
        default=None,
        description="Key insights about competitor performance in AI search"
    )
    generated_at: datetime = Field(description="When these suggestions were generated")
    model_used: str = Field(description="LLM model used for generation")


class GenerateSuggestionsRequest(BaseModel):
    """Request body for generating AI suggestions"""
    brand_id: str = Field(default="wix", description="Brand ID to analyze")
    force_refresh: bool = Field(
        default=False,
        description="Force regeneration even if cached suggestions exist"
    )
