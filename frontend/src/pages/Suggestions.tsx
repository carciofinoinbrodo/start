import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Sparkles, Compass, AlertCircle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import {
  generateStrategicSummary,
  generateQuickWins,
  generateContentOpportunities,
  generateCompetitorGaps,
  generateTechnicalChecklist,
  generateOutreachTargets,
} from '../api/client';
import type {
  StrategicSummaryResponse,
  QuickWinResponse,
  ContentOpportunityResponse,
  CompetitorGapResponse,
  TechnicalCheckResponse,
  OutreachTargetResponse,
} from '../api/client';
import {
  StrategicSummaryCard,
  QuickWinsWidget,
  ContentOpportunitiesTable,
  CompetitorGapsWidget,
  TechnicalChecklist,
  OutreachTargets,
} from '../components/suggestions';

const CACHE_KEY = 'geo-suggestions-cache';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface SectionState<T> {
  status: LoadingState;
  data: T | null;
  error: string | null;
}

interface CachedData {
  summary?: StrategicSummaryResponse;
  quickWins?: QuickWinResponse[];
  contentOpps?: ContentOpportunityResponse[];
  competitorGaps?: CompetitorGapResponse[];
  techChecklist?: TechnicalCheckResponse[];
  outreach?: OutreachTargetResponse[];
  timestamp?: string;
}

function WidgetSkeleton() {
  return (
    <div className="card p-6 h-full animate-pulse">
      <div className="h-6 w-1/3 bg-[var(--bg-hover)] rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-[var(--bg-hover)] rounded" />
        <div className="h-4 w-2/3 bg-[var(--bg-hover)] rounded" />
        <div className="h-4 w-3/4 bg-[var(--bg-hover)] rounded" />
      </div>
    </div>
  );
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card p-6 h-full border border-[var(--danger)]/30">
      <div className="flex items-center gap-3 text-[var(--danger)] mb-3">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">Failed to load</span>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm text-[var(--accent-primary)] hover:underline"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({ onGenerate, isAnyLoading }: { onGenerate: () => void; isAnyLoading: boolean }) {
  return (
    <div className="card p-8 sm:p-12 text-center animate-fade-in-up">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center mx-auto mb-5 sm:mb-6">
        <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent-primary)]" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2 sm:mb-3">
        GEO Strategy Advisor
      </h2>
      <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md mx-auto mb-6">
        Generate AI-powered insights to improve your visibility in AI search results.
        Get specific, actionable recommendations based on your data.
      </p>
      <button
        onClick={onGenerate}
        disabled={isAnyLoading}
        className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[var(--accent-primary)] hover:bg-[#1d4ed8] text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg shadow-sm active:scale-98"
      >
        {isAnyLoading ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            <span className="hidden sm:inline">Generating Strategy...</span>
            <span className="sm:hidden">Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Generate GEO Strategy</span>
            <span className="sm:hidden">Generate Strategy</span>
          </>
        )}
      </button>
    </div>
  );
}

export function Suggestions() {
  const brandId = 'wix';

  const [summary, setSummary] = useState<SectionState<StrategicSummaryResponse>>({
    status: 'idle', data: null, error: null
  });
  const [quickWins, setQuickWins] = useState<SectionState<QuickWinResponse[]>>({
    status: 'idle', data: null, error: null
  });
  const [contentOpps, setContentOpps] = useState<SectionState<ContentOpportunityResponse[]>>({
    status: 'idle', data: null, error: null
  });
  const [competitorGaps, setCompetitorGaps] = useState<SectionState<CompetitorGapResponse[]>>({
    status: 'idle', data: null, error: null
  });
  const [techChecklist, setTechChecklist] = useState<SectionState<TechnicalCheckResponse[]>>({
    status: 'idle', data: null, error: null
  });
  const [outreach, setOutreach] = useState<SectionState<OutreachTargetResponse[]>>({
    status: 'idle', data: null, error: null
  });
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedData = JSON.parse(cached);
        if (data.summary) setSummary({ status: 'success', data: data.summary, error: null });
        if (data.quickWins) setQuickWins({ status: 'success', data: data.quickWins, error: null });
        if (data.contentOpps) setContentOpps({ status: 'success', data: data.contentOpps, error: null });
        if (data.competitorGaps) setCompetitorGaps({ status: 'success', data: data.competitorGaps, error: null });
        if (data.techChecklist) setTechChecklist({ status: 'success', data: data.techChecklist, error: null });
        if (data.outreach) setOutreach({ status: 'success', data: data.outreach, error: null });
        if (data.timestamp) setCacheTimestamp(data.timestamp);
      }
    } catch (e) {
      console.error('Failed to load cached suggestions:', e);
    }
  }, []);

  const saveToCache = (key: keyof CachedData, value: unknown) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const data: CachedData = cached ? JSON.parse(cached) : {};
      data[key] = value as never;
      data.timestamp = new Date().toISOString();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setCacheTimestamp(data.timestamp);
    } catch (e) {
      console.error('Failed to save to cache:', e);
    }
  };

  const isAnyLoading = [summary, quickWins, contentOpps, competitorGaps, techChecklist, outreach]
    .some(s => s.status === 'loading');

  const hasAnyData = [summary, quickWins, contentOpps, competitorGaps, techChecklist, outreach]
    .some(s => s.data !== null);

  const generateSection = async <T,>(
    setter: React.Dispatch<React.SetStateAction<SectionState<T>>>,
    fetcher: () => Promise<{ data: T }>,
    cacheKey: keyof CachedData
  ) => {
    setter({ status: 'loading', data: null, error: null });
    try {
      const result = await fetcher();
      setter({ status: 'success', data: result.data, error: null });
      saveToCache(cacheKey, result.data);
    } catch (err) {
      setter({
        status: 'error',
        data: null,
        error: err instanceof Error ? err.message : 'Failed to generate'
      });
    }
  };

  const handleGenerateAll = () => {
    generateSection(setSummary, () => generateStrategicSummary(brandId), 'summary');
    generateSection(setQuickWins, () => generateQuickWins(brandId), 'quickWins');
    generateSection(setContentOpps, () => generateContentOpportunities(brandId), 'contentOpps');
    generateSection(setCompetitorGaps, () => generateCompetitorGaps(brandId), 'competitorGaps');
    generateSection(setTechChecklist, () => generateTechnicalChecklist(brandId), 'techChecklist');
    generateSection(setOutreach, () => generateOutreachTargets(brandId), 'outreach');
  };

  const handleRetrySummary = () => generateSection(setSummary, () => generateStrategicSummary(brandId), 'summary');
  const handleRetryQuickWins = () => generateSection(setQuickWins, () => generateQuickWins(brandId), 'quickWins');
  const handleRetryContentOpps = () => generateSection(setContentOpps, () => generateContentOpportunities(brandId), 'contentOpps');
  const handleRetryCompetitorGaps = () => generateSection(setCompetitorGaps, () => generateCompetitorGaps(brandId), 'competitorGaps');
  const handleRetryTechChecklist = () => generateSection(setTechChecklist, () => generateTechnicalChecklist(brandId), 'techChecklist');
  const handleRetryOutreach = () => generateSection(setOutreach, () => generateOutreachTargets(brandId), 'outreach');

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Header
        title="GEO Strategy Advisor"
        subtitle="AI-powered insights for AI search visibility"
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* Regenerate Button - shown when any data exists */}
        {hasAnyData && (
          <div className="card p-3 sm:p-4 mb-4 sm:mb-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Refresh all sections with fresh AI analysis
                </p>
                {cacheTimestamp && (
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5 sm:mt-1">
                    Last generated: {new Date(cacheTimestamp).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleGenerateAll}
                disabled={isAnyLoading}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[#1d4ed8] text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-98 flex-shrink-0"
              >
                {isAnyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Regenerate All</span>
                    <span className="sm:hidden">Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty State - no data yet */}
        {!hasAnyData && !isAnyLoading && (
          <EmptyState onGenerate={handleGenerateAll} isAnyLoading={isAnyLoading} />
        )}

        {/* Results Grid - shown when generating or has data */}
        {(hasAnyData || isAnyLoading) && (
          <div className="space-y-5">
            {/* Strategic Summary */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              {summary.status === 'loading' && <WidgetSkeleton />}
              {summary.status === 'error' && (
                <WidgetError message={summary.error!} onRetry={handleRetrySummary} />
              )}
              {summary.status === 'success' && summary.data && (
                <StrategicSummaryCard summary={summary.data} />
              )}
            </div>

            {/* Quick Wins & Technical Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              <div className="animate-fade-in-up h-full" style={{ animationDelay: '50ms' }}>
                {quickWins.status === 'loading' && <WidgetSkeleton />}
                {quickWins.status === 'error' && (
                  <WidgetError message={quickWins.error!} onRetry={handleRetryQuickWins} />
                )}
                {quickWins.status === 'success' && quickWins.data && (
                  <QuickWinsWidget quickWins={quickWins.data} />
                )}
              </div>
              <div className="animate-fade-in-up h-full" style={{ animationDelay: '100ms' }}>
                {techChecklist.status === 'loading' && <WidgetSkeleton />}
                {techChecklist.status === 'error' && (
                  <WidgetError message={techChecklist.error!} onRetry={handleRetryTechChecklist} />
                )}
                {techChecklist.status === 'success' && techChecklist.data && (
                  <TechnicalChecklist checks={techChecklist.data} />
                )}
              </div>
            </div>

            {/* Content Opportunities */}
            <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {contentOpps.status === 'loading' && <WidgetSkeleton />}
              {contentOpps.status === 'error' && (
                <WidgetError message={contentOpps.error!} onRetry={handleRetryContentOpps} />
              )}
              {contentOpps.status === 'success' && contentOpps.data && (
                <ContentOpportunitiesTable opportunities={contentOpps.data} />
              )}
            </div>

            {/* Competitor Gaps & Outreach Targets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              <div className="animate-fade-in-up h-full" style={{ animationDelay: '200ms' }}>
                {competitorGaps.status === 'loading' && <WidgetSkeleton />}
                {competitorGaps.status === 'error' && (
                  <WidgetError message={competitorGaps.error!} onRetry={handleRetryCompetitorGaps} />
                )}
                {competitorGaps.status === 'success' && competitorGaps.data && (
                  <CompetitorGapsWidget gaps={competitorGaps.data} />
                )}
              </div>
              <div className="animate-fade-in-up h-full" style={{ animationDelay: '250ms' }}>
                {outreach.status === 'loading' && <WidgetSkeleton />}
                {outreach.status === 'error' && (
                  <WidgetError message={outreach.error!} onRetry={handleRetryOutreach} />
                )}
                {outreach.status === 'success' && outreach.data && (
                  <OutreachTargets targets={outreach.data} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
