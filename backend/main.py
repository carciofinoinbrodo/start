from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from collections import Counter
from itertools import groupby

from .database import create_db_and_tables, get_session
from .models import Brand, Prompt, PromptBrandMention, Source, PromptSource
from .schemas import (
    BrandResponse,
    PromptResponse,
    PromptDetailResponse,
    PromptBrandMentionResponse,
    SourceResponse,
    SourceInPromptResponse,
    RunResponse,
    DashboardMetricsResponse,
    MetricResponse,
    DailyVisibilityResponse,
)

app = FastAPI(title="AiSEO API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_brands()


def seed_brands():
    """Seed initial brand data if not exists"""
    from sqlmodel import Session
    from .database import engine

    brands_data = [
        {"id": "shopify", "name": "Shopify", "type": "primary", "color": "#06b6d4"},
        {"id": "woocommerce", "name": "WooCommerce", "type": "competitor", "color": "#8b5cf6"},
        {"id": "bigcommerce", "name": "BigCommerce", "type": "competitor", "color": "#ec4899"},
        {"id": "wix", "name": "Wix", "type": "competitor", "color": "#f59e0b"},
        {"id": "squarespace", "name": "Squarespace", "type": "competitor", "color": "#10b981"},
    ]

    with Session(engine) as session:
        for brand_data in brands_data:
            existing = session.get(Brand, brand_data["id"])
            if not existing:
                session.add(Brand(**brand_data))
        session.commit()


def get_run_data(session: Session, prompt: Prompt, brands: list[Brand]) -> RunResponse:
    """Build run response for a single prompt/run"""
    mentions = session.exec(
        select(PromptBrandMention).where(PromptBrandMention.prompt_id == prompt.id)
    ).all()

    brand_responses = []
    for brand in brands:
        mention = next((m for m in mentions if m.brand_id == brand.id), None)
        brand_responses.append(
            PromptBrandMentionResponse(
                brandId=brand.id,
                brandName=brand.name,
                position=mention.position if mention and mention.mentioned else 0,
                mentioned=mention.mentioned if mention else False,
                sentiment=mention.sentiment if mention and mention.sentiment else "neutral",
            )
        )

    # Get sources
    prompt_sources = session.exec(
        select(PromptSource).where(PromptSource.prompt_id == prompt.id)
    ).all()
    source_responses = []
    for ps in prompt_sources:
        source = session.get(Source, ps.source_id)
        if source:
            source_responses.append(
                SourceInPromptResponse(
                    domain=source.domain,
                    url=source.url,
                    title=source.title,
                    description=source.description,
                    publishedDate=source.published_date,
                    citationOrder=ps.citation_order,
                )
            )
    source_responses.sort(key=lambda x: x.citationOrder)

    mentioned_brands = [b for b in brand_responses if b.mentioned]

    # Calculate visibility based on Shopify's position (primary brand)
    shopify_mention = next((b for b in brand_responses if b.brandId == "shopify"), None)
    if shopify_mention and shopify_mention.mentioned and shopify_mention.position > 0:
        # Position 1 = 100%, Position 2 = 80%, Position 3 = 60%, etc.
        visibility = max(0, 100 - (shopify_mention.position - 1) * 20)
    else:
        visibility = 0  # Not mentioned

    avg_position = (
        sum(b.position for b in mentioned_brands) / len(mentioned_brands)
        if mentioned_brands
        else 0
    )

    return RunResponse(
        id=prompt.id,
        runNumber=prompt.run_number if hasattr(prompt, 'run_number') else 1,
        scrapedAt=prompt.scraped_at.isoformat() if prompt.scraped_at else "",
        visibility=visibility,
        avgPosition=round(avg_position, 1),
        totalMentions=len(mentioned_brands),
        brands=brand_responses,
        responseText=prompt.response_text,
        sources=source_responses,
    )


@app.get("/api/brands", response_model=list[BrandResponse])
def get_brands(session: Session = Depends(get_session)):
    """Get all brands with computed metrics"""
    brands = session.exec(select(Brand)).all()
    # Count unique queries (not individual runs)
    all_prompts = session.exec(select(Prompt)).all()
    unique_queries = set(p.query for p in all_prompts)
    total_queries = len(unique_queries)

    result = []
    for brand in brands:
        mentions = session.exec(
            select(PromptBrandMention).where(
                PromptBrandMention.brand_id == brand.id,
                PromptBrandMention.mentioned == True,
            )
        ).all()

        # Count queries where brand was mentioned (not runs)
        mentioned_queries = set()
        for m in mentions:
            prompt = session.get(Prompt, m.prompt_id)
            if prompt:
                mentioned_queries.add(prompt.query)

        visibility = (len(mentioned_queries) / total_queries * 100) if total_queries > 0 else 0
        avg_position = (
            sum(m.position for m in mentions if m.position) / len(mentions)
            if mentions
            else 0
        )
        sentiments = [m.sentiment for m in mentions if m.sentiment]
        most_common_sentiment = (
            Counter(sentiments).most_common(1)[0][0] if sentiments else "neutral"
        )

        # Determine trend based on recent data (simplified)
        trend = "stable"
        if visibility > 50:
            trend = "up"
        elif visibility < 30:
            trend = "down"

        result.append(
            BrandResponse(
                id=brand.id,
                name=brand.name,
                type=brand.type,
                color=brand.color,
                visibility=round(visibility, 1),
                avgPosition=round(avg_position, 1),
                trend=trend,
                sentiment=most_common_sentiment,
            )
        )

    return result


@app.get("/api/prompts", response_model=list[PromptResponse])
def get_prompts(session: Session = Depends(get_session)):
    """Get all unique queries with aggregated stats across runs"""
    all_prompts = session.exec(select(Prompt).order_by(Prompt.query, Prompt.run_number)).all()
    brands = session.exec(select(Brand)).all()

    # Group prompts by query
    grouped = {}
    for prompt in all_prompts:
        if prompt.query not in grouped:
            grouped[prompt.query] = []
        grouped[prompt.query].append(prompt)

    result = []
    for idx, (query, prompts_list) in enumerate(grouped.items(), 1):
        # Use the latest run for brand data display
        latest_prompt = max(prompts_list, key=lambda p: p.run_number if hasattr(p, 'run_number') else 1)

        # Calculate aggregated stats across all runs
        all_visibilities = []
        all_positions = []
        all_mentions_count = []

        for prompt in prompts_list:
            mentions = session.exec(
                select(PromptBrandMention).where(PromptBrandMention.prompt_id == prompt.id)
            ).all()

            brand_responses = []
            for brand in brands:
                mention = next((m for m in mentions if m.brand_id == brand.id), None)
                brand_responses.append(
                    PromptBrandMentionResponse(
                        brandId=brand.id,
                        brandName=brand.name,
                        position=mention.position if mention and mention.mentioned else 0,
                        mentioned=mention.mentioned if mention else False,
                        sentiment=mention.sentiment if mention and mention.sentiment else "neutral",
                    )
                )

            mentioned_brands = [b for b in brand_responses if b.mentioned]

            # Calculate visibility based on Shopify's position
            shopify_mention = next((b for b in brand_responses if b.brandId == "shopify"), None)
            if shopify_mention and shopify_mention.mentioned and shopify_mention.position > 0:
                visibility = max(0, 100 - (shopify_mention.position - 1) * 20)
            else:
                visibility = 0

            avg_position = (
                sum(b.position for b in mentioned_brands) / len(mentioned_brands)
                if mentioned_brands
                else 0
            )

            all_visibilities.append(visibility)
            if avg_position > 0:
                all_positions.append(avg_position)
            all_mentions_count.append(len(mentioned_brands))

        # Get brand data from latest run for display
        latest_mentions = session.exec(
            select(PromptBrandMention).where(PromptBrandMention.prompt_id == latest_prompt.id)
        ).all()

        latest_brand_responses = []
        for brand in brands:
            mention = next((m for m in latest_mentions if m.brand_id == brand.id), None)
            latest_brand_responses.append(
                PromptBrandMentionResponse(
                    brandId=brand.id,
                    brandName=brand.name,
                    position=mention.position if mention and mention.mentioned else 0,
                    mentioned=mention.mentioned if mention else False,
                    sentiment=mention.sentiment if mention and mention.sentiment else "neutral",
                )
            )

        # Calculate averages
        avg_visibility = sum(all_visibilities) / len(all_visibilities) if all_visibilities else 0
        avg_pos = sum(all_positions) / len(all_positions) if all_positions else 0
        avg_mentions = sum(all_mentions_count) / len(all_mentions_count) if all_mentions_count else 0

        result.append(
            PromptResponse(
                id=f"query-{idx}",
                query=query,
                visibility=round(avg_visibility, 1),
                avgPosition=round(avg_pos, 1),
                totalMentions=round(avg_mentions),
                totalRuns=len(prompts_list),
                brands=latest_brand_responses,
            )
        )

    return result


@app.get("/api/prompts/{query_id}", response_model=PromptDetailResponse)
def get_prompt_detail(query_id: str, session: Session = Depends(get_session)):
    """Get detailed prompt info with all runs"""
    # Extract index from query_id (e.g., "query-1" -> 1)
    try:
        idx = int(query_id.replace("query-", "").replace("prompt-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid query ID format")

    all_prompts = session.exec(select(Prompt).order_by(Prompt.query, Prompt.run_number)).all()
    brands = session.exec(select(Brand)).all()

    # Group prompts by query
    grouped = {}
    for prompt in all_prompts:
        if prompt.query not in grouped:
            grouped[prompt.query] = []
        grouped[prompt.query].append(prompt)

    # Get the query by index
    queries = list(grouped.keys())
    if idx < 1 or idx > len(queries):
        raise HTTPException(status_code=404, detail="Query not found")

    query = queries[idx - 1]
    prompts_list = grouped[query]

    # Build runs
    runs = []
    for prompt in sorted(prompts_list, key=lambda p: p.run_number if hasattr(p, 'run_number') else 1):
        runs.append(get_run_data(session, prompt, brands))

    # Use latest run for aggregate display
    latest_run = runs[-1] if runs else None

    # Calculate averages across all runs
    avg_visibility = sum(r.visibility for r in runs) / len(runs) if runs else 0
    avg_position = sum(r.avgPosition for r in runs if r.avgPosition > 0) / len([r for r in runs if r.avgPosition > 0]) if any(r.avgPosition > 0 for r in runs) else 0
    avg_mentions = sum(r.totalMentions for r in runs) / len(runs) if runs else 0

    return PromptDetailResponse(
        id=query_id,
        query=query,
        visibility=round(avg_visibility, 1),
        avgPosition=round(avg_position, 1),
        totalMentions=round(avg_mentions),
        totalRuns=len(runs),
        brands=latest_run.brands if latest_run else [],
        runs=runs,
    )


@app.get("/api/sources", response_model=list[SourceResponse])
def get_sources(session: Session = Depends(get_session)):
    """Get all sources with usage metrics"""
    # Count unique queries (not runs)
    all_prompts = session.exec(select(Prompt)).all()
    unique_queries = set(p.query for p in all_prompts)
    total_queries = len(unique_queries)

    sources = session.exec(select(Source)).all()

    result = []
    for source in sources:
        prompt_links = session.exec(
            select(PromptSource).where(PromptSource.source_id == source.id)
        ).all()

        # Count unique queries citing this source
        citing_queries = set()
        for pl in prompt_links:
            prompt = session.get(Prompt, pl.prompt_id)
            if prompt:
                citing_queries.add(prompt.query)

        usage = (len(citing_queries) / total_queries * 100) if total_queries > 0 else 0
        avg_citations = (
            sum(pl.citation_order for pl in prompt_links) / len(prompt_links)
            if prompt_links
            else 0
        )

        result.append(
            SourceResponse(
                domain=source.domain,
                usage=round(usage, 1),
                avgCitations=round(avg_citations, 1),
            )
        )

    # Sort by usage descending
    result.sort(key=lambda x: x.usage, reverse=True)
    return result


@app.get("/api/metrics", response_model=DashboardMetricsResponse)
def get_metrics(session: Session = Depends(get_session)):
    """Get dashboard KPIs"""
    # Count unique queries (not runs)
    all_prompts = session.exec(select(Prompt)).all()
    unique_queries = set(p.query for p in all_prompts)
    total_queries = len(unique_queries)
    total_sources = session.exec(select(func.count(Source.id))).one()

    # Get primary brand (Shopify) metrics
    shopify_mentions = session.exec(
        select(PromptBrandMention).where(
            PromptBrandMention.brand_id == "shopify",
            PromptBrandMention.mentioned == True,
        )
    ).all()

    # Count unique queries where Shopify is mentioned
    shopify_queries = set()
    for m in shopify_mentions:
        prompt = session.get(Prompt, m.prompt_id)
        if prompt:
            shopify_queries.add(prompt.query)

    visibility = (len(shopify_queries) / total_queries * 100) if total_queries > 0 else 0
    avg_position = (
        sum(m.position for m in shopify_mentions if m.position) / len(shopify_mentions)
        if shopify_mentions
        else 0
    )

    return DashboardMetricsResponse(
        visibility=MetricResponse(value=round(visibility, 1), change=0),
        totalPrompts=MetricResponse(value=total_queries, change=0),
        totalSources=MetricResponse(value=total_sources, change=0),
        avgPosition=MetricResponse(value=round(avg_position, 1), change=0),
    )


@app.get("/api/visibility", response_model=list[DailyVisibilityResponse])
def get_visibility_data(session: Session = Depends(get_session)):
    """Get time series visibility data for charts"""
    # For now, generate synthetic data based on actual brand visibility
    brands = session.exec(select(Brand)).all()
    all_prompts = session.exec(select(Prompt)).all()
    unique_queries = set(p.query for p in all_prompts)
    total_queries = len(unique_queries)

    brand_visibility = {}
    for brand in brands:
        mentions = session.exec(
            select(PromptBrandMention).where(
                PromptBrandMention.brand_id == brand.id,
                PromptBrandMention.mentioned == True,
            )
        ).all()

        # Count unique queries
        mentioned_queries = set()
        for m in mentions:
            prompt = session.get(Prompt, m.prompt_id)
            if prompt:
                mentioned_queries.add(prompt.query)

        brand_visibility[brand.id] = (
            (len(mentioned_queries) / total_queries * 100) if total_queries > 0 else 0
        )

    # Generate 90 days of data with slight variations
    import random
    random.seed(42)  # Consistent data

    result = []
    today = datetime.now()
    for i in range(89, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")

        day_data = DailyVisibilityResponse(
            date=date_str,
            shopify=round(brand_visibility.get("shopify", 0) + random.uniform(-5, 5), 1),
            woocommerce=round(brand_visibility.get("woocommerce", 0) + random.uniform(-5, 5), 1),
            bigcommerce=round(brand_visibility.get("bigcommerce", 0) + random.uniform(-5, 5), 1),
            wix=round(brand_visibility.get("wix", 0) + random.uniform(-5, 5), 1),
            squarespace=round(brand_visibility.get("squarespace", 0) + random.uniform(-5, 5), 1),
        )
        result.append(day_data)

    return result


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
