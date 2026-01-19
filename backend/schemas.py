from pydantic import BaseModel
from typing import Optional
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
