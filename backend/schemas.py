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


# --- AI Suggestions V2 Schemas (Enhanced for SEO Professionals) ---

class StrategicSummary(BaseModel):
    """Executive summary for quick understanding"""
    headline: str = Field(
        description="One-line summary of current state (e.g., 'Strong in informational, weak in commercial queries')"
    )
    key_insight: str = Field(
        description="The single most important insight from the analysis"
    )
    biggest_opportunity: str = Field(
        description="The highest-impact opportunity identified"
    )
    biggest_threat: str = Field(
        description="The most urgent competitive threat"
    )
    recommended_focus: str = Field(
        description="What to focus on in the next 30 days"
    )


class QuickWin(BaseModel):
    """Immediate action (1-8 hours effort)"""
    action: str = Field(
        description="Specific, actionable task (e.g., 'Add FAQ schema to pricing page')"
    )
    target_page: str | None = Field(
        default=None,
        description="Specific URL to optimize, or None for site-wide"
    )
    effort_hours: float = Field(
        ge=0.5, le=8,
        description="Estimated hours to complete (0.5-8)"
    )
    expected_outcome: str = Field(
        description="What will improve after this action"
    )
    steps: list[str] = Field(
        description="Step-by-step implementation guide"
    )


class ContentOpportunity(BaseModel):
    """Content piece to create or optimize"""
    topic: str = Field(
        description="Content topic or title (e.g., 'Wix vs Shopify comparison guide')"
    )
    action_type: Literal["create", "optimize", "expand"] = Field(
        description="What to do with this content"
    )
    target_queries: list[str] = Field(
        description="Specific queries this content should capture"
    )
    competitor_gap: str | None = Field(
        default=None,
        description="How competitors are currently winning this topic"
    )
    content_brief: str = Field(
        description="2-3 sentence brief of what the content should cover"
    )
    effort_days: float = Field(
        ge=0.5, le=30,
        description="Estimated days to complete"
    )
    impact: Literal["low", "medium", "high", "critical"] = Field(
        description="Expected impact on AI visibility"
    )


class CompetitorGap(BaseModel):
    """Gap where a competitor is outperforming"""
    competitor: str = Field(description="Name of the competitor")
    gap_type: Literal["content", "authority", "technical", "sentiment"] = Field(
        description="Category of the gap"
    )
    description: str = Field(
        description="Detailed description of the gap"
    )
    action_to_close: str = Field(
        description="Specific action to close this gap"
    )
    urgency: Literal["immediate", "this-quarter", "long-term"] = Field(
        description="How urgently this should be addressed"
    )
    evidence: list[str] = Field(
        default=[],
        description="Data points or URLs supporting this gap"
    )


class TechnicalCheck(BaseModel):
    """Technical GEO optimization item"""
    check: str = Field(
        description="Name of the check (e.g., 'llms.txt file implemented')"
    )
    status: Literal["done", "missing", "needs-improvement"] = Field(
        description="Current status"
    )
    priority: Literal["critical", "important", "nice-to-have"] = Field(
        description="Priority level"
    )
    how_to_fix: str = Field(
        description="How to implement or fix this"
    )
    effort: str = Field(
        description="Time estimate (e.g., '30 minutes', '2 hours')"
    )


class OutreachTarget(BaseModel):
    """Publication/community to pursue for authority building"""
    name: str = Field(
        description="Name of the target (e.g., 'r/ecommerce', 'Forbes')"
    )
    type: Literal["publication", "blog", "podcast", "community", "review-site"] = Field(
        description="Type of target"
    )
    why: str = Field(
        description="Why this target matters for AI visibility"
    )
    action: str = Field(
        description="Specific action to take"
    )


class AISuggestionsResponseV2(BaseModel):
    """
    Enhanced AI suggestions for SEO professionals.
    Focuses on actionable insights, not percentages.
    """
    brand: str = Field(description="Brand being analyzed")
    generated_at: datetime = Field(description="When these suggestions were generated")
    model_used: str = Field(description="LLM model used for generation")

    strategic_summary: StrategicSummary = Field(
        description="Executive-level strategic summary"
    )
    quick_wins: list[QuickWin] = Field(
        description="3-5 immediate actions that can be done today"
    )
    content_opportunities: list[ContentOpportunity] = Field(
        description="5-10 content opportunities ranked by impact"
    )
    competitor_gaps: list[CompetitorGap] = Field(
        description="3-6 specific gaps where competitors are winning"
    )
    technical_checklist: list[TechnicalCheck] = Field(
        description="5-10 technical GEO optimization checks"
    )
    outreach_targets: list[OutreachTarget] = Field(
        description="5-10 publications/communities to pursue"
    )


# --- Split API Response Schemas (one per widget) ---

class GeoSectionBase(BaseModel):
    """Base for all GEO section responses"""
    brand: str = Field(description="Brand being analyzed")
    generated_at: datetime = Field(description="When this section was generated")
    model_used: str = Field(description="LLM model used")


class StrategicSummarySection(GeoSectionBase):
    """Response for /api/geo/strategic-summary"""
    data: StrategicSummary


class QuickWinsSection(GeoSectionBase):
    """Response for /api/geo/quick-wins"""
    data: list[QuickWin]


class ContentOpportunitiesSection(GeoSectionBase):
    """Response for /api/geo/content-opportunities"""
    data: list[ContentOpportunity]


class CompetitorGapsSection(GeoSectionBase):
    """Response for /api/geo/competitor-gaps"""
    data: list[CompetitorGap]


class TechnicalChecklistSection(GeoSectionBase):
    """Response for /api/geo/technical-checklist"""
    data: list[TechnicalCheck]


class OutreachTargetsSection(GeoSectionBase):
    """Response for /api/geo/outreach-targets"""
    data: list[OutreachTarget]


# --- LLM Output Wrappers (for structured output parsing) ---

class QuickWinsList(BaseModel):
    """Wrapper for LLM to generate list of quick wins"""
    items: list[QuickWin]


class ContentOpportunitiesList(BaseModel):
    """Wrapper for LLM to generate list of content opportunities"""
    items: list[ContentOpportunity]


class CompetitorGapsList(BaseModel):
    """Wrapper for LLM to generate list of competitor gaps"""
    items: list[CompetitorGap]


class TechnicalChecksList(BaseModel):
    """Wrapper for LLM to generate list of technical checks"""
    items: list[TechnicalCheck]


class OutreachTargetsList(BaseModel):
    """Wrapper for LLM to generate list of outreach targets"""
    items: list[OutreachTarget]
