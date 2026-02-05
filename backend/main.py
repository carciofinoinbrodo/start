import os
from dotenv import load_dotenv
load_dotenv()  # Load .env file before any other imports

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from collections import Counter
from itertools import groupby

from database import create_db_and_tables, get_session
from models import Brand, Prompt, PromptBrandMention, Source, PromptSource, PromptEmbedding, CachedSuggestion
from schemas import (
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
    SourcesAnalyticsResponse,
    SourcesSummary,
    DomainBreakdown,
    SourceType,
    TopSource,
    SuggestionsResponse,
    Suggestion,
    SuggestionExample,
    BrandCreate,
    BrandDetailResponse,
    BrandListResponse,
    BrandPromptDetail,
    BrandMonthlyVisibility,
    # AI Suggestions schemas
    AISuggestionsResponse,
    GenerateSuggestionsRequest,
)

app = FastAPI(title="AiSEO API", version="1.0.0")

# CORS for frontend - read from environment variable
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_brands()


def seed_brands():
    """Seed initial brand data if not exists (handles concurrent workers)"""
    from sqlmodel import Session
    from database import engine

    brands_data = [
        {"id": "wix", "name": "Wix", "type": "primary", "color": "#06b6d4"},
        {"id": "shopify", "name": "Shopify", "type": "competitor", "color": "#f59e0b"},
        {"id": "woocommerce", "name": "WooCommerce", "type": "competitor", "color": "#8b5cf6"},
        {"id": "bigcommerce", "name": "BigCommerce", "type": "competitor", "color": "#ec4899"},
        {"id": "squarespace", "name": "Squarespace", "type": "competitor", "color": "#10b981"},
    ]

    with Session(engine) as session:
        for brand_data in brands_data:
            # Use merge to handle race condition with multiple workers
            # merge() will insert if not exists, or update if exists
            brand = Brand(**brand_data)
            session.merge(brand)
        try:
            session.commit()
        except Exception:
            # Ignore errors from concurrent seeding (race condition)
            session.rollback()


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

    # Calculate visibility based on Wix's position (primary brand)
    wix_mention = next((b for b in brand_responses if b.brandId == "wix"), None)
    if wix_mention and wix_mention.mentioned and wix_mention.position > 0:
        # Position 1 = 100%, Position 2 = 80%, Position 3 = 60%, etc.
        visibility = max(0, 100 - (wix_mention.position - 1) * 20)
    else:
        visibility = 0  # Not mentioned

    # Use Wix's position (primary brand), not average of all brands
    avg_position = wix_mention.position if wix_mention and wix_mention.mentioned else 0

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
    """Get all brands with computed metrics (January 2026 only, trend based on Jan vs Dec)"""
    brands = session.exec(select(Brand)).all()

    # Get prompts by month
    all_prompts = session.exec(select(Prompt)).all()
    jan_prompts = [p for p in all_prompts if p.scraped_at and p.scraped_at.strftime("%Y-%m") == "2026-01"]
    dec_prompts = [p for p in all_prompts if p.scraped_at and p.scraped_at.strftime("%Y-%m") == "2025-12"]

    jan_queries = set(p.query for p in jan_prompts)
    dec_queries = set(p.query for p in dec_prompts)
    total_jan_queries = len(jan_queries)
    total_dec_queries = len(dec_queries)

    result = []
    for brand in brands:
        # Get January mentions
        jan_mentioned_queries = set()
        jan_positions = []
        jan_sentiments = []

        for prompt in jan_prompts:
            mention = session.exec(
                select(PromptBrandMention).where(
                    PromptBrandMention.prompt_id == prompt.id,
                    PromptBrandMention.brand_id == brand.id,
                    PromptBrandMention.mentioned == True,
                )
            ).first()
            if mention:
                jan_mentioned_queries.add(prompt.query)
                if mention.position:
                    jan_positions.append(mention.position)
                if mention.sentiment:
                    jan_sentiments.append(mention.sentiment)

        jan_visibility = (len(jan_mentioned_queries) / total_jan_queries * 100) if total_jan_queries > 0 else 0
        avg_position = sum(jan_positions) / len(jan_positions) if jan_positions else 0
        most_common_sentiment = (
            Counter(jan_sentiments).most_common(1)[0][0] if jan_sentiments else "neutral"
        )

        # Get December mentions for trend calculation
        dec_mentioned_queries = set()
        for prompt in dec_prompts:
            mention = session.exec(
                select(PromptBrandMention).where(
                    PromptBrandMention.prompt_id == prompt.id,
                    PromptBrandMention.brand_id == brand.id,
                    PromptBrandMention.mentioned == True,
                )
            ).first()
            if mention:
                dec_mentioned_queries.add(prompt.query)

        dec_visibility = (len(dec_mentioned_queries) / total_dec_queries * 100) if total_dec_queries > 0 else 0

        # Determine trend by comparing Jan vs Dec visibility
        trend = "stable"
        if jan_visibility > dec_visibility + 2:  # +2% threshold to avoid noise
            trend = "up"
        elif jan_visibility < dec_visibility - 2:
            trend = "down"

        result.append(
            BrandResponse(
                id=brand.id,
                name=brand.name,
                type=brand.type,
                color=brand.color,
                visibility=round(jan_visibility, 1),
                avgPosition=round(avg_position, 1),
                trend=trend,
                sentiment=most_common_sentiment,
            )
        )

    # Sort: primary brand first, then by visibility descending
    result.sort(key=lambda x: (x.type != "primary", -x.visibility))
    return result


@app.get("/api/brands/details", response_model=BrandListResponse)
def get_brands_details(session: Session = Depends(get_session)):
    """Get detailed brand analytics for brand management page"""
    brands = session.exec(select(Brand)).all()
    all_prompts = session.exec(select(Prompt)).all()

    # Group prompts by month
    months_order = ["Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026"]
    month_map = {
        "2025-09": "Sep 2025",
        "2025-10": "Oct 2025",
        "2025-11": "Nov 2025",
        "2025-12": "Dec 2025",
        "2026-01": "Jan 2026",
    }

    prompts_by_month = {m: [] for m in months_order}
    for prompt in all_prompts:
        if prompt.scraped_at:
            month_key = prompt.scraped_at.strftime("%Y-%m")
            if month_key in month_map:
                prompts_by_month[month_map[month_key]].append(prompt)

    # January prompts for current stats
    jan_prompts = prompts_by_month.get("Jan 2026", [])
    dec_prompts = prompts_by_month.get("Dec 2025", [])
    jan_queries = set(p.query for p in jan_prompts)
    dec_queries = set(p.query for p in dec_prompts)

    result = []
    for brand in brands:
        # Parse variations
        variations = brand.variations.split(",") if brand.variations else [brand.name]
        variations = [v.strip() for v in variations if v.strip()]

        # Get January mentions for current stats
        jan_mentioned_queries = set()
        jan_positions = []
        jan_sentiments = []
        top_prompts = []

        for prompt in jan_prompts:
            mention = session.exec(
                select(PromptBrandMention).where(
                    PromptBrandMention.prompt_id == prompt.id,
                    PromptBrandMention.brand_id == brand.id,
                    PromptBrandMention.mentioned == True,
                )
            ).first()
            if mention:
                jan_mentioned_queries.add(prompt.query)
                if mention.position:
                    jan_positions.append(mention.position)
                if mention.sentiment:
                    jan_sentiments.append(mention.sentiment)
                top_prompts.append(BrandPromptDetail(
                    query=prompt.query,
                    position=mention.position,
                    sentiment=mention.sentiment,
                    scrapedAt=prompt.scraped_at.isoformat() if prompt.scraped_at else ""
                ))

        # Deduplicate top_prompts by query, keep best position
        unique_prompts = {}
        for tp in top_prompts:
            if tp.query not in unique_prompts or (tp.position and (not unique_prompts[tp.query].position or tp.position < unique_prompts[tp.query].position)):
                unique_prompts[tp.query] = tp
        top_prompts = sorted(unique_prompts.values(), key=lambda x: x.position if x.position else 999)[:10]

        jan_visibility = (len(jan_mentioned_queries) / len(jan_queries) * 100) if jan_queries else 0
        avg_position = sum(jan_positions) / len(jan_positions) if jan_positions else 0
        most_common_sentiment = Counter(jan_sentiments).most_common(1)[0][0] if jan_sentiments else "neutral"

        # Calculate December visibility for trend
        dec_mentioned_queries = set()
        for prompt in dec_prompts:
            mention = session.exec(
                select(PromptBrandMention).where(
                    PromptBrandMention.prompt_id == prompt.id,
                    PromptBrandMention.brand_id == brand.id,
                    PromptBrandMention.mentioned == True,
                )
            ).first()
            if mention:
                dec_mentioned_queries.add(prompt.query)

        dec_visibility = (len(dec_mentioned_queries) / len(dec_queries) * 100) if dec_queries else 0

        trend = "stable"
        if jan_visibility > dec_visibility + 2:
            trend = "up"
        elif jan_visibility < dec_visibility - 2:
            trend = "down"

        # Calculate visibility by month
        visibility_by_month = []
        for month_name in months_order:
            month_prompts = prompts_by_month.get(month_name, [])
            month_queries = set(p.query for p in month_prompts)

            mentioned_queries = set()
            for prompt in month_prompts:
                mention = session.exec(
                    select(PromptBrandMention).where(
                        PromptBrandMention.prompt_id == prompt.id,
                        PromptBrandMention.brand_id == brand.id,
                        PromptBrandMention.mentioned == True,
                    )
                ).first()
                if mention:
                    mentioned_queries.add(prompt.query)

            month_visibility = (len(mentioned_queries) / len(month_queries) * 100) if month_queries else 0
            visibility_by_month.append(BrandMonthlyVisibility(
                month=month_name,
                visibility=round(month_visibility, 1)
            ))

        # Count total mentions across all time
        total_mentions = session.exec(
            select(func.count(PromptBrandMention.id)).where(
                PromptBrandMention.brand_id == brand.id,
                PromptBrandMention.mentioned == True,
            )
        ).one()

        result.append(BrandDetailResponse(
            id=brand.id,
            name=brand.name,
            type=brand.type,
            color=brand.color,
            variations=variations,
            visibility=round(jan_visibility, 1),
            avgPosition=round(avg_position, 1),
            trend=trend,
            sentiment=most_common_sentiment,
            totalMentions=total_mentions,
            totalPrompts=len(jan_mentioned_queries),
            topPrompts=top_prompts,
            visibilityByMonth=visibility_by_month
        ))

    # Sort: primary brand first, then by visibility descending
    result.sort(key=lambda x: (x.type != "primary", -x.visibility))
    return BrandListResponse(brands=result)


@app.post("/api/brands", response_model=BrandDetailResponse)
def create_brand(brand_data: BrandCreate, session: Session = Depends(get_session)):
    """Create a new brand and sync mentions from existing prompts"""
    import re

    # Check if brand already exists
    existing = session.get(Brand, brand_data.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Brand with ID '{brand_data.id}' already exists")

    # Create the brand
    variations_str = ",".join(brand_data.variations) if brand_data.variations else brand_data.name
    new_brand = Brand(
        id=brand_data.id,
        name=brand_data.name,
        type=brand_data.type,
        color=brand_data.color,
        variations=variations_str
    )
    session.add(new_brand)
    session.commit()
    session.refresh(new_brand)

    # Sync mentions for all existing prompts
    all_prompts = session.exec(select(Prompt)).all()
    search_terms = brand_data.variations if brand_data.variations else [brand_data.name]

    for prompt in all_prompts:
        if not prompt.response_text:
            continue

        response_lower = prompt.response_text.lower()

        # Check if any variation is mentioned
        mentioned = False
        position = None
        context = None

        for term in search_terms:
            if term.lower() in response_lower:
                mentioned = True
                # Find position (simple: count newlines before first mention)
                idx = response_lower.find(term.lower())
                # Estimate position by checking for numbered lists or paragraph position
                before_text = response_lower[:idx]
                # Count how many other brands appear before
                brands = session.exec(select(Brand)).all()
                other_brands_before = 0
                for b in brands:
                    b_variations = b.variations.split(",") if b.variations else [b.name]
                    for bv in b_variations:
                        bv_idx = response_lower.find(bv.lower())
                        if 0 <= bv_idx < idx:
                            other_brands_before += 1
                            break
                position = other_brands_before + 1

                # Extract context (50 chars before and after)
                start = max(0, idx - 50)
                end = min(len(prompt.response_text), idx + len(term) + 50)
                context = prompt.response_text[start:end]
                break

        # Create mention record
        mention = PromptBrandMention(
            prompt_id=prompt.id,
            brand_id=new_brand.id,
            mentioned=mentioned,
            position=position if mentioned else None,
            sentiment="neutral",  # Default sentiment
            context=context
        )
        session.add(mention)

    session.commit()

    # Return the brand details
    return get_brand_detail(new_brand.id, session)


def get_brand_detail(brand_id: str, session: Session) -> BrandDetailResponse:
    """Helper to get brand detail response"""
    brand = session.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    all_prompts = session.exec(select(Prompt)).all()

    # January prompts
    jan_prompts = [p for p in all_prompts if p.scraped_at and p.scraped_at.strftime("%Y-%m") == "2026-01"]
    dec_prompts = [p for p in all_prompts if p.scraped_at and p.scraped_at.strftime("%Y-%m") == "2025-12"]
    jan_queries = set(p.query for p in jan_prompts)
    dec_queries = set(p.query for p in dec_prompts)

    variations = brand.variations.split(",") if brand.variations else [brand.name]
    variations = [v.strip() for v in variations if v.strip()]

    # Get January mentions
    jan_mentioned_queries = set()
    jan_positions = []
    jan_sentiments = []
    top_prompts = []

    for prompt in jan_prompts:
        mention = session.exec(
            select(PromptBrandMention).where(
                PromptBrandMention.prompt_id == prompt.id,
                PromptBrandMention.brand_id == brand.id,
                PromptBrandMention.mentioned == True,
            )
        ).first()
        if mention:
            jan_mentioned_queries.add(prompt.query)
            if mention.position:
                jan_positions.append(mention.position)
            if mention.sentiment:
                jan_sentiments.append(mention.sentiment)
            top_prompts.append(BrandPromptDetail(
                query=prompt.query,
                position=mention.position,
                sentiment=mention.sentiment,
                scrapedAt=prompt.scraped_at.isoformat() if prompt.scraped_at else ""
            ))

    unique_prompts = {}
    for tp in top_prompts:
        if tp.query not in unique_prompts or (tp.position and (not unique_prompts[tp.query].position or tp.position < unique_prompts[tp.query].position)):
            unique_prompts[tp.query] = tp
    top_prompts = sorted(unique_prompts.values(), key=lambda x: x.position if x.position else 999)[:10]

    jan_visibility = (len(jan_mentioned_queries) / len(jan_queries) * 100) if jan_queries else 0
    avg_position = sum(jan_positions) / len(jan_positions) if jan_positions else 0
    most_common_sentiment = Counter(jan_sentiments).most_common(1)[0][0] if jan_sentiments else "neutral"

    dec_mentioned_queries = set()
    for prompt in dec_prompts:
        mention = session.exec(
            select(PromptBrandMention).where(
                PromptBrandMention.prompt_id == prompt.id,
                PromptBrandMention.brand_id == brand.id,
                PromptBrandMention.mentioned == True,
            )
        ).first()
        if mention:
            dec_mentioned_queries.add(prompt.query)

    dec_visibility = (len(dec_mentioned_queries) / len(dec_queries) * 100) if dec_queries else 0

    trend = "stable"
    if jan_visibility > dec_visibility + 2:
        trend = "up"
    elif jan_visibility < dec_visibility - 2:
        trend = "down"

    # Visibility by month
    months_order = ["Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026"]
    month_map = {
        "2025-09": "Sep 2025",
        "2025-10": "Oct 2025",
        "2025-11": "Nov 2025",
        "2025-12": "Dec 2025",
        "2026-01": "Jan 2026",
    }

    prompts_by_month = {m: [] for m in months_order}
    for prompt in all_prompts:
        if prompt.scraped_at:
            month_key = prompt.scraped_at.strftime("%Y-%m")
            if month_key in month_map:
                prompts_by_month[month_map[month_key]].append(prompt)

    visibility_by_month = []
    for month_name in months_order:
        month_prompts = prompts_by_month.get(month_name, [])
        month_queries = set(p.query for p in month_prompts)

        mentioned_queries = set()
        for prompt in month_prompts:
            mention = session.exec(
                select(PromptBrandMention).where(
                    PromptBrandMention.prompt_id == prompt.id,
                    PromptBrandMention.brand_id == brand.id,
                    PromptBrandMention.mentioned == True,
                )
            ).first()
            if mention:
                mentioned_queries.add(prompt.query)

        month_visibility = (len(mentioned_queries) / len(month_queries) * 100) if month_queries else 0
        visibility_by_month.append(BrandMonthlyVisibility(
            month=month_name,
            visibility=round(month_visibility, 1)
        ))

    total_mentions = session.exec(
        select(func.count(PromptBrandMention.id)).where(
            PromptBrandMention.brand_id == brand.id,
            PromptBrandMention.mentioned == True,
        )
    ).one()

    return BrandDetailResponse(
        id=brand.id,
        name=brand.name,
        type=brand.type,
        color=brand.color,
        variations=variations,
        visibility=round(jan_visibility, 1),
        avgPosition=round(avg_position, 1),
        trend=trend,
        sentiment=most_common_sentiment,
        totalMentions=total_mentions,
        totalPrompts=len(jan_mentioned_queries),
        topPrompts=top_prompts,
        visibilityByMonth=visibility_by_month
    )


@app.delete("/api/brands/{brand_id}")
def delete_brand(brand_id: str, session: Session = Depends(get_session)):
    """Delete a brand and all its mentions"""
    brand = session.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Prevent deleting primary brand
    if brand.type == "primary":
        raise HTTPException(status_code=400, detail="Cannot delete primary brand")

    # Delete all mentions for this brand
    mentions = session.exec(
        select(PromptBrandMention).where(PromptBrandMention.brand_id == brand_id)
    ).all()
    for mention in mentions:
        session.delete(mention)

    # Delete the brand
    session.delete(brand)
    session.commit()

    return {"success": True, "message": f"Brand '{brand_id}' deleted successfully"}


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

            # Calculate visibility based on Wix's position (primary brand)
            wix_mention = next((b for b in brand_responses if b.brandId == "wix"), None)
            if wix_mention and wix_mention.mentioned and wix_mention.position > 0:
                visibility = max(0, 100 - (wix_mention.position - 1) * 20)
            else:
                visibility = 0

            # Use Wix's position (primary brand), not average of all brands
            wix_position = wix_mention.position if wix_mention and wix_mention.mentioned else 0

            all_visibilities.append(visibility)
            if wix_position > 0:
                all_positions.append(wix_position)
            all_mentions_count.append(len(mentioned_brands))

        # Aggregate mentioned brands across ALL runs (not just latest)
        all_mentioned_brand_ids = set()
        for prompt in prompts_list:
            mentions = session.exec(
                select(PromptBrandMention).where(
                    PromptBrandMention.prompt_id == prompt.id,
                    PromptBrandMention.mentioned == True
                )
            ).all()
            for m in mentions:
                all_mentioned_brand_ids.add(m.brand_id)

        # Build aggregated brand responses (brand is "mentioned" if mentioned in ANY run)
        aggregated_brand_responses = []
        for brand in brands:
            aggregated_brand_responses.append(
                PromptBrandMentionResponse(
                    brandId=brand.id,
                    brandName=brand.name,
                    position=0,  # Position varies by run, use 0 for aggregated view
                    mentioned=brand.id in all_mentioned_brand_ids,
                    sentiment="neutral",  # Aggregated sentiment
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
                brands=aggregated_brand_responses,
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
    """Get dashboard KPIs with month-over-month changes (Jan vs Dec)"""
    all_prompts = session.exec(select(Prompt)).all()
    unique_queries = set(p.query for p in all_prompts)
    total_queries = len(unique_queries)

    # Separate January and December prompts
    jan_prompts = [p for p in all_prompts if p.scraped_at and p.scraped_at.strftime("%Y-%m") == "2026-01"]
    dec_prompts = [p for p in all_prompts if p.scraped_at and p.scraped_at.strftime("%Y-%m") == "2025-12"]

    jan_queries = set(p.query for p in jan_prompts)
    dec_queries = set(p.query for p in dec_prompts)

    # Calculate sources: count total source citations across all runs
    # Sources this month (January 2026)
    jan_source_count = 0
    for prompt in jan_prompts:
        prompt_sources = session.exec(
            select(PromptSource).where(PromptSource.prompt_id == prompt.id)
        ).all()
        jan_source_count += len(prompt_sources)

    # Sources last month (December 2025) for change calculation
    dec_source_count = 0
    for prompt in dec_prompts:
        prompt_sources = session.exec(
            select(PromptSource).where(PromptSource.prompt_id == prompt.id)
        ).all()
        dec_source_count += len(prompt_sources)

    # Total sources across all months
    total_source_count = 0
    for prompt in all_prompts:
        prompt_sources = session.exec(
            select(PromptSource).where(PromptSource.prompt_id == prompt.id)
        ).all()
        total_source_count += len(prompt_sources)

    sources_change = jan_source_count - dec_source_count

    # Calculate Wix visibility for January
    jan_wix_queries = set()
    jan_wix_positions = []
    for prompt in jan_prompts:
        mention = session.exec(
            select(PromptBrandMention).where(
                PromptBrandMention.prompt_id == prompt.id,
                PromptBrandMention.brand_id == "wix",
                PromptBrandMention.mentioned == True,
            )
        ).first()
        if mention:
            jan_wix_queries.add(prompt.query)
            if mention.position:
                jan_wix_positions.append(mention.position)

    jan_visibility = (len(jan_wix_queries) / len(jan_queries) * 100) if jan_queries else 0
    jan_avg_position = sum(jan_wix_positions) / len(jan_wix_positions) if jan_wix_positions else 0

    # Calculate Wix visibility for December
    dec_wix_queries = set()
    dec_wix_positions = []
    for prompt in dec_prompts:
        mention = session.exec(
            select(PromptBrandMention).where(
                PromptBrandMention.prompt_id == prompt.id,
                PromptBrandMention.brand_id == "wix",
                PromptBrandMention.mentioned == True,
            )
        ).first()
        if mention:
            dec_wix_queries.add(prompt.query)
            if mention.position:
                dec_wix_positions.append(mention.position)

    dec_visibility = (len(dec_wix_queries) / len(dec_queries) * 100) if dec_queries else 0
    dec_avg_position = sum(dec_wix_positions) / len(dec_wix_positions) if dec_wix_positions else 0

    # Calculate changes (Jan vs Dec)
    visibility_change = jan_visibility - dec_visibility
    # Position: lower is better, so flip sign (Dec - Jan = positive when improved)
    position_change = dec_avg_position - jan_avg_position  # Positive means improvement

    return DashboardMetricsResponse(
        visibility=MetricResponse(value=round(jan_visibility, 1), change=round(visibility_change, 1)),
        totalPrompts=MetricResponse(value=total_queries, change=0),
        totalSources=MetricResponse(value=jan_source_count, change=sources_change, total=total_source_count),
        avgPosition=MetricResponse(value=round(jan_avg_position, 1), change=round(position_change, 2)),
    )


@app.get("/api/visibility", response_model=list[DailyVisibilityResponse])
def get_visibility_data(session: Session = Depends(get_session)):
    """Get monthly visibility data for charts (Sep 2025 - Jan 2026)"""
    brands = session.exec(select(Brand)).all()
    all_prompts = session.exec(select(Prompt)).all()

    # Group prompts by month
    months = {
        "Sep 2025": [],
        "Oct 2025": [],
        "Nov 2025": [],
        "Dec 2025": [],
        "Jan 2026": [],
    }

    for prompt in all_prompts:
        if prompt.scraped_at:
            month_str = prompt.scraped_at.strftime("%Y-%m")
            if month_str == "2025-09":
                months["Sep 2025"].append(prompt)
            elif month_str == "2025-10":
                months["Oct 2025"].append(prompt)
            elif month_str == "2025-11":
                months["Nov 2025"].append(prompt)
            elif month_str == "2025-12":
                months["Dec 2025"].append(prompt)
            elif month_str == "2026-01":
                months["Jan 2026"].append(prompt)

    result = []
    for month_name in ["Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026"]:
        month_prompts = months[month_name]
        unique_queries = set(p.query for p in month_prompts)
        total_queries = len(unique_queries)

        brand_visibility = {}
        for brand in brands:
            # Get mentions for prompts in this month
            mentioned_queries = set()
            for prompt in month_prompts:
                mention = session.exec(
                    select(PromptBrandMention).where(
                        PromptBrandMention.prompt_id == prompt.id,
                        PromptBrandMention.brand_id == brand.id,
                        PromptBrandMention.mentioned == True,
                    )
                ).first()
                if mention:
                    mentioned_queries.add(prompt.query)

            brand_visibility[brand.id] = (
                (len(mentioned_queries) / total_queries * 100) if total_queries > 0 else 0
            )

        result.append(DailyVisibilityResponse(
            date=month_name,
            shopify=round(brand_visibility.get("shopify", 0), 1),
            woocommerce=round(brand_visibility.get("woocommerce", 0), 1),
            bigcommerce=round(brand_visibility.get("bigcommerce", 0), 1),
            wix=round(brand_visibility.get("wix", 0), 1),
            squarespace=round(brand_visibility.get("squarespace", 0), 1),
        ))

    return result


@app.get("/api/sources/analytics", response_model=SourcesAnalyticsResponse)
def get_sources_analytics(session: Session = Depends(get_session)):
    """Get detailed analytics for citation sources"""
    sources = session.exec(select(Source)).all()
    all_prompts = session.exec(select(Prompt)).all()

    # Classify domains by type
    def classify_domain(domain: str) -> str:
        domain_lower = domain.lower()
        # Brand/official sites
        if any(brand in domain_lower for brand in ['shopify', 'wix', 'woocommerce', 'bigcommerce', 'squarespace', 'wordpress']):
            return 'brand'
        # Community/forums
        if any(community in domain_lower for community in ['reddit', 'quora', 'stackexchange', 'stackoverflow', 'discourse']):
            return 'community'
        # News/media
        if any(news in domain_lower for news in ['forbes', 'techcrunch', 'entrepreneur', 'inc.com', 'businessinsider', 'cnet', 'zdnet', 'pcmag', 'theverge']):
            return 'news'
        # Blogs (common blog patterns)
        if any(blog in domain_lower for blog in ['blog', 'medium.com', 'dev.to', 'hashnode', 'substack']):
            return 'blog'
        # Review sites
        if any(review in domain_lower for review in ['g2.com', 'capterra', 'trustpilot', 'trustradius', 'getapp']):
            return 'review'
        # Default: check for common blog patterns in URL structure
        return 'other'

    # Build domain citation counts
    domain_citations = Counter()
    source_citations = {}  # source_id -> list of prompt queries

    for source in sources:
        prompt_links = session.exec(
            select(PromptSource).where(PromptSource.source_id == source.id)
        ).all()

        # Count total citations (across all runs)
        domain_citations[source.domain] += len(prompt_links)

        # Get unique prompts citing this source
        prompt_queries = []
        for pl in prompt_links:
            prompt = session.get(Prompt, pl.prompt_id)
            if prompt and prompt.query not in prompt_queries:
                prompt_queries.append(prompt.query)
        source_citations[source.id] = prompt_queries

    total_citations = sum(domain_citations.values())
    total_sources = len(sources)
    total_domains = len(set(s.domain for s in sources))

    # Build domain breakdown (top 20)
    domain_breakdown = []
    for domain, citations in domain_citations.most_common(20):
        domain_breakdown.append(DomainBreakdown(
            domain=domain,
            citations=citations,
            percentage=round(citations / total_citations * 100, 1) if total_citations > 0 else 0,
            type=classify_domain(domain)
        ))

    # Build source types breakdown
    type_counts = Counter()
    for source in sources:
        source_type = classify_domain(source.domain)
        # Refine classification: if URL contains /blog/ it's likely a blog post
        if source.url and '/blog/' in source.url.lower():
            source_type = 'blog'
        type_counts[source_type] += 1

    source_types = []
    for stype, count in type_counts.most_common():
        source_types.append(SourceType(
            type=stype,
            count=count,
            percentage=round(count / total_sources * 100, 1) if total_sources > 0 else 0
        ))

    # Build top sources list (top 50 by citation count)
    sources_with_citations = []
    for source in sources:
        prompt_links = session.exec(
            select(PromptSource).where(PromptSource.source_id == source.id)
        ).all()
        sources_with_citations.append((source, len(prompt_links)))

    sources_with_citations.sort(key=lambda x: x[1], reverse=True)

    top_sources = []
    for source, citation_count in sources_with_citations[:50]:
        top_sources.append(TopSource(
            id=source.id,
            domain=source.domain,
            url=source.url,
            title=source.title,
            citations=citation_count,
            prompts=source_citations.get(source.id, [])[:5]  # Limit to 5 prompts
        ))

    return SourcesAnalyticsResponse(
        summary=SourcesSummary(
            totalSources=total_sources,
            totalDomains=total_domains,
            totalCitations=total_citations,
            avgCitationsPerSource=round(total_citations / total_sources, 1) if total_sources > 0 else 0
        ),
        domainBreakdown=domain_breakdown,
        sourceTypes=source_types,
        topSources=top_sources
    )


@app.get("/api/suggestions", response_model=SuggestionsResponse)
def get_suggestions(session: Session = Depends(get_session)):
    """Get AI SEO improvement suggestions based on source data analysis"""
    sources = session.exec(select(Source)).all()
    all_prompts = session.exec(select(Prompt)).all()

    # Calculate source type percentages
    total_sources = len(sources)

    def classify_domain(domain: str, url: str = "") -> str:
        domain_lower = domain.lower()
        url_lower = url.lower() if url else ""

        if '/blog/' in url_lower:
            return 'blog'
        if any(brand in domain_lower for brand in ['shopify', 'wix', 'woocommerce', 'bigcommerce', 'squarespace']):
            return 'brand'
        if any(community in domain_lower for community in ['reddit', 'quora']):
            return 'community'
        if any(news in domain_lower for news in ['forbes', 'techcrunch', 'entrepreneur', 'inc.com', 'businessinsider']):
            return 'news'
        if any(review in domain_lower for review in ['g2.com', 'capterra', 'trustpilot']):
            return 'review'
        return 'other'

    type_counts = Counter()
    for source in sources:
        type_counts[classify_domain(source.domain, source.url)] += 1

    blog_pct = round(type_counts.get('blog', 0) / total_sources * 100) if total_sources > 0 else 0
    community_pct = round(type_counts.get('community', 0) / total_sources * 100) if total_sources > 0 else 0
    news_pct = round(type_counts.get('news', 0) / total_sources * 100) if total_sources > 0 else 0
    review_pct = round(type_counts.get('review', 0) / total_sources * 100) if total_sources > 0 else 0

    # Get sample sources for examples
    blog_sources = [s for s in sources if classify_domain(s.domain, s.url) == 'blog'][:3]
    community_sources = [s for s in sources if classify_domain(s.domain, s.url) == 'community'][:3]
    news_sources = [s for s in sources if classify_domain(s.domain, s.url) == 'news'][:3]

    # Get comparison prompts
    comparison_prompts = [p.query for p in all_prompts if any(word in p.query.lower() for word in ['vs', 'versus', 'compare', 'best', 'top'])]
    unique_comparison = list(set(comparison_prompts))[:5]
    comparison_pct = round(len(set(comparison_prompts)) / len(set(p.query for p in all_prompts)) * 100) if all_prompts else 0

    # Calculate Wix visibility score for overall AI SEO score
    jan_prompts = [p for p in all_prompts if p.scraped_at and p.scraped_at.strftime("%Y-%m") == "2026-01"]
    jan_queries = set(p.query for p in jan_prompts)

    wix_mentioned = 0
    for query in jan_queries:
        query_prompts = [p for p in jan_prompts if p.query == query]
        for prompt in query_prompts:
            mention = session.exec(
                select(PromptBrandMention).where(
                    PromptBrandMention.prompt_id == prompt.id,
                    PromptBrandMention.brand_id == "wix",
                    PromptBrandMention.mentioned == True,
                )
            ).first()
            if mention:
                wix_mentioned += 1
                break

    visibility_score = round(wix_mentioned / len(jan_queries) * 100) if jan_queries else 0

    # Overall AI SEO score (weighted average)
    ai_seo_score = min(100, round(visibility_score * 0.9 + 10))  # Base 10 + visibility contribution

    suggestions = [
        Suggestion(
            id=1,
            priority="high",
            category="content",
            title="Create More Blog Content",
            description=f"{blog_pct}% of AI citation sources are blog posts. Publishing regular, in-depth blog content about ecommerce topics significantly increases your chances of being cited by AI systems. Focus on comprehensive guides and tutorials.",
            stat=f"{blog_pct}%",
            statLabel="of sources are blogs",
            action="Start a blog with ecommerce guides, tutorials, and industry insights",
            examples=[
                SuggestionExample(type="source", domain=s.domain, title=s.title) for s in blog_sources
            ] + [
                SuggestionExample(type="prompt", query=q) for q in unique_comparison[:2]
            ]
        ),
        Suggestion(
            id=2,
            priority="medium",
            category="community",
            title="Engage on Reddit & Forums",
            description=f"{community_pct}% of AI citations come from community discussions on Reddit and forums. Participating authentically in relevant subreddits like r/ecommerce, r/shopify, and r/smallbusiness can boost your visibility.",
            stat=f"{community_pct}%",
            statLabel="of sources are community sites",
            action="Join r/ecommerce, r/entrepreneur, and relevant subreddit communities",
            examples=[
                SuggestionExample(type="source", domain=s.domain, title=s.title) for s in community_sources
            ]
        ),
        Suggestion(
            id=3,
            priority="high",
            category="authority",
            title="Get Featured in Industry Publications",
            description=f"News and industry publications account for {news_pct}% of AI citations. PR efforts, guest posts, and getting featured on authority sites like Forbes, TechCrunch, and Entrepreneur improve AI visibility significantly.",
            stat=f"{news_pct}%",
            statLabel="are news/industry sites",
            action="Pitch stories to ecommerce and tech publications, pursue guest posting opportunities",
            examples=[
                SuggestionExample(type="source", domain=s.domain, title=s.title) for s in news_sources
            ]
        ),
        Suggestion(
            id=4,
            priority="medium",
            category="technical",
            title="Optimize for Comparison Queries",
            description=f"{comparison_pct}% of tracked prompts are comparison queries (e.g., 'best platform', 'X vs Y'). Creating dedicated comparison pages and landing pages optimized for these queries can improve visibility.",
            stat=f"{comparison_pct}%",
            statLabel="of queries compare platforms",
            action="Build comparison landing pages and feature comparison content",
            examples=[
                SuggestionExample(type="prompt", query=q) for q in unique_comparison[:3]
            ]
        ),
        Suggestion(
            id=5,
            priority="low",
            category="content",
            title="Collect Reviews on G2 & Capterra",
            description=f"Review platforms account for {review_pct}% of sources. Having strong presence on review sites like G2, Capterra, and Trustpilot provides social proof that AI systems reference.",
            stat=f"{review_pct}%",
            statLabel="are review platforms",
            action="Encourage customers to leave reviews on G2, Capterra, and Trustpilot",
            examples=[]
        ),
    ]

    return SuggestionsResponse(
        score=ai_seo_score,
        suggestions=suggestions
    )


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ============================================================================
# AI-Powered Suggestions Endpoints
# ============================================================================

@app.post("/api/suggestions/generate")
async def generate_ai_suggestions(
    request: GenerateSuggestionsRequest = None,
    brand_id: str = "wix",
    force_refresh: bool = False,
    session: Session = Depends(get_session)
):
    """
    Generate AI-powered SEO suggestions using RAG and LLM.

    This endpoint:
    1. Checks for cached suggestions (unless force_refresh=True)
    2. Uses pgvector for semantic similarity search (if available)
    3. Calls Claude/GPT with structured output for recommendations
    4. Caches the result for future requests

    Args:
        brand_id: Brand to analyze (default: "wix")
        force_refresh: Force regeneration even if cached (default: False)

    Returns:
        AISuggestionsResponse with AI-generated recommendations
    """
    import json
    import logging

    logger = logging.getLogger(__name__)

    # Handle request body if provided
    if request:
        brand_id = request.brand_id
        force_refresh = request.force_refresh

    # 1. Check cache first (unless force_refresh)
    if not force_refresh:
        cached = session.exec(
            select(CachedSuggestion)
            .where(CachedSuggestion.brand_id == brand_id)
            .where(CachedSuggestion.expires_at > datetime.utcnow())
            .order_by(CachedSuggestion.generated_at.desc())
        ).first()

        if cached:
            logger.info(f"Returning cached suggestions for brand {brand_id}")
            return json.loads(cached.suggestions_json)

    # 2. Get the brand
    brand = session.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail=f"Brand {brand_id} not found")

    # 3. Try to use AI services
    try:
        from services import EmbeddingService, LLMClient, RAGService
        from services.llm_client import LLMRateLimitError

        # Initialize services
        embedding_service = EmbeddingService()
        llm_client = LLMClient()
        rag_service = RAGService(session, embedding_service)

        # Check if LLM is available
        if not llm_client.is_available():
            logger.error("No LLM provider available - check API keys")
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. Please configure ANTHROPIC_API_KEY or OPENAI_API_KEY."
            )

        # 4. Calculate brand metrics
        metrics = rag_service.calculate_brand_metrics(brand_id)

        # 5. Find similar prompts using RAG
        similar_prompts = await rag_service.find_similar_prompts(
            query=f"SEO for {brand.name} ecommerce platform visibility",
            brand_id=brand_id,
            limit=20
        )

        # 6. Build context for LLM
        brand_context = rag_service.build_brand_context(brand, metrics)
        analysis_context = rag_service.build_analysis_context(brand, similar_prompts, metrics)

        # 7. Generate suggestions with LLM
        suggestions = await llm_client.generate_structured_output(
            analysis_context=analysis_context,
            brand_context=brand_context,
            output_schema=AISuggestionsResponse
        )

        # 8. Cache the result
        cache_hours = int(os.getenv("SUGGESTIONS_CACHE_HOURS", "24"))
        cached_suggestion = CachedSuggestion(
            brand_id=brand_id,
            suggestions_json=suggestions.model_dump_json(),
            generated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=cache_hours),
            model_used=suggestions.model_used
        )
        session.add(cached_suggestion)
        session.commit()

        logger.info(f"Generated and cached AI suggestions for brand {brand_id}")
        return suggestions

    except ImportError as e:
        logger.error(f"AI services not available: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service dependencies not installed: {e}"
        )
    except LLMRateLimitError as e:
        logger.error(f"LLM rate limit error: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable - rate limit exceeded")
    except Exception as e:
        logger.error(f"Error generating AI suggestions: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"AI generation failed: {str(e)}"
        )


def _get_fallback_suggestions(session: Session, brand: Brand) -> dict:
    """
    Return fallback suggestions when AI is unavailable.
    Uses the existing hardcoded suggestions logic.
    """
    from schemas import KeywordOpportunity, OnPageRecommendation

    # Calculate basic metrics
    all_prompts = list(session.exec(select(Prompt)).all())
    mentions = list(session.exec(
        select(PromptBrandMention)
        .where(PromptBrandMention.brand_id == brand.id)
        .where(PromptBrandMention.mentioned == True)
    ).all())

    total_queries = len(set(p.query for p in all_prompts))
    mentioned_queries = len(set(m.prompt_id for m in mentions))
    visibility = (mentioned_queries / total_queries * 100) if total_queries > 0 else 0

    positions = [m.position for m in mentions if m.position]
    avg_position = sum(positions) / len(positions) if positions else 0

    return {
        "brand": brand.name,
        "ai_visibility_score": visibility,
        "summary": f"Analysis based on {total_queries} queries. AI suggestions require API keys to be configured.",
        "keyword_opportunities": [
            {
                "query": "best ecommerce platform for small business",
                "intent": "commercial",
                "difficulty": "medium",
                "estimated_impact": "high",
                "rationale": "High-volume comparison query with strong purchase intent"
            },
            {
                "query": f"{brand.name.lower()} vs shopify",
                "intent": "commercial",
                "difficulty": "low",
                "estimated_impact": "medium",
                "rationale": "Direct brand comparison query - should own this SERP"
            }
        ],
        "on_page_recommendations": [
            {
                "page_url": "*",
                "priority": "high",
                "change_type": "content",
                "recommendation": "Add Answer-First summaries to key landing pages",
                "implementation_steps": [
                    "Identify top 10 landing pages by traffic",
                    "Add 50-word direct answer summary at top of each page",
                    "Use bullet points for key features",
                    "Test with AI search tools to verify extractability"
                ]
            },
            {
                "page_url": "*",
                "priority": "medium",
                "change_type": "technical",
                "recommendation": "Implement comprehensive FAQ schema",
                "implementation_steps": [
                    "Identify top 20 user questions from support data",
                    "Create FAQ page with JSON-LD schema markup",
                    "Ensure answers are concise and factual"
                ]
            }
        ],
        "competitor_insights": "Configure AI API keys to enable competitive analysis.",
        "generated_at": datetime.utcnow().isoformat(),
        "model_used": "fallback-heuristics"
    }


@app.post("/api/embeddings/sync")
async def sync_embeddings(
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """
    Backfill embeddings for existing prompts.

    Run this endpoint to generate embeddings for prompts that don't have them yet.
    This enables semantic similarity search for RAG.

    Args:
        limit: Maximum number of prompts to process (default: 100)

    Returns:
        Summary of embeddings created
    """
    import logging
    from database import IS_POSTGRES

    logger = logging.getLogger(__name__)

    if not IS_POSTGRES:
        return {
            "status": "skipped",
            "message": "Embedding sync only available with PostgreSQL + pgvector",
            "created": 0
        }

    try:
        from services import EmbeddingService

        embedding_service = EmbeddingService()
        if not embedding_service.is_available():
            return {
                "status": "error",
                "message": "OpenAI API key not configured",
                "created": 0
            }

        # Find prompts without embeddings
        existing_ids = session.exec(
            select(PromptEmbedding.prompt_id)
        ).all()
        existing_ids_set = set(existing_ids)

        prompts_to_embed = session.exec(
            select(Prompt)
            .where(Prompt.id.notin_(existing_ids_set) if existing_ids_set else True)
            .limit(limit)
        ).all()

        if not prompts_to_embed:
            return {
                "status": "complete",
                "message": "All prompts already have embeddings",
                "created": 0
            }

        # Generate embeddings
        created = 0
        for prompt in prompts_to_embed:
            if not prompt.response_text:
                continue

            embedding = await embedding_service.embed_prompt(
                prompt.query,
                prompt.response_text
            )

            if embedding:
                # Note: For full pgvector support, we'd store the embedding
                # This is a simplified version that just tracks which prompts are embedded
                prompt_embedding = PromptEmbedding(
                    prompt_id=prompt.id,
                    created_at=datetime.utcnow()
                )
                session.add(prompt_embedding)
                created += 1

        session.commit()
        logger.info(f"Created {created} embeddings")

        return {
            "status": "success",
            "message": f"Generated embeddings for {created} prompts",
            "created": created,
            "remaining": len(prompts_to_embed) - created
        }

    except ImportError as e:
        return {
            "status": "error",
            "message": f"AI services not available: {e}",
            "created": 0
        }
    except Exception as e:
        logger.error(f"Error syncing embeddings: {e}")
        return {
            "status": "error",
            "message": str(e),
            "created": 0
        }


@app.get("/api/suggestions/status")
def get_suggestions_status(session: Session = Depends(get_session)):
    """
    Get status of AI suggestions feature.

    Returns:
        Status of AI services and cached suggestions
    """
    from database import IS_POSTGRES, is_vector_search_available

    # Check AI services availability
    try:
        from services import EmbeddingService, LLMClient

        embedding_service = EmbeddingService()
        llm_client = LLMClient()

        embedding_available = embedding_service.is_available()
        llm_available = llm_client.is_available()
    except ImportError:
        embedding_available = False
        llm_available = False

    # Count cached suggestions
    cached_count = session.exec(
        select(func.count(CachedSuggestion.id))
    ).one()

    # Count embeddings
    embedding_count = session.exec(
        select(func.count(PromptEmbedding.id))
    ).one()

    prompt_count = session.exec(
        select(func.count(Prompt.id))
    ).one()

    return {
        "ai_suggestions_enabled": llm_available,
        "services": {
            "embedding_service": embedding_available,
            "llm_service": llm_available,
            "vector_search": IS_POSTGRES and is_vector_search_available() if IS_POSTGRES else False
        },
        "data": {
            "cached_suggestions": cached_count,
            "prompts_with_embeddings": embedding_count,
            "total_prompts": prompt_count,
            "embedding_coverage": f"{(embedding_count / prompt_count * 100):.1f}%" if prompt_count > 0 else "0%"
        }
    }
