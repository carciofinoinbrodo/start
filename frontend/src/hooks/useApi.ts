import { useState, useEffect, useCallback, type DependencyList } from 'react';
import {
  fetchBrands,
  fetchPrompts,
  fetchPromptDetail,
  fetchSources,
  fetchMetrics,
  fetchVisibilityData,
  fetchSourcesAnalytics,
  fetchSuggestions,
  fetchBrandsDetails,
  type BrandResponse,
  type PromptResponse,
  type PromptDetailResponse,
  type SourceResponse,
  type DashboardMetricsResponse,
  type DailyVisibilityResponse,
  type SourcesAnalyticsResponse,
  type SuggestionsDataResponse,
  type BrandsListResponse,
} from '../api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiQueryOptions {
  enabled?: boolean;
}

/**
 * Generic hook factory for API queries.
 * Reduces code duplication across all data-fetching hooks.
 */
function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
  options: UseApiQueryOptions = {}
) {
  const { enabled = true } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  const refetch = useCallback(() => {
    if (!enabled) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetcher()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }));
  }, [fetcher, enabled]);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { ...state, refetch };
}

// ============================================
// Exported hooks using the generic factory
// ============================================

export function useBrands() {
  return useApiQuery<BrandResponse[]>(fetchBrands);
}

export function usePrompts() {
  return useApiQuery<PromptResponse[]>(fetchPrompts);
}

export function usePromptDetail(promptId: number | null) {
  const fetcher = useCallback(() => fetchPromptDetail(promptId!), [promptId]);
  return useApiQuery<PromptDetailResponse>(
    fetcher,
    [promptId],
    { enabled: promptId !== null }
  );
}

export function useSources() {
  return useApiQuery<SourceResponse[]>(fetchSources);
}

export function useMetrics() {
  return useApiQuery<DashboardMetricsResponse>(fetchMetrics);
}

export function useVisibilityData() {
  return useApiQuery<DailyVisibilityResponse[]>(fetchVisibilityData);
}

export function useSourcesAnalytics() {
  return useApiQuery<SourcesAnalyticsResponse>(fetchSourcesAnalytics);
}

export function useSuggestions() {
  return useApiQuery<SuggestionsDataResponse>(fetchSuggestions);
}

export function useBrandsDetails() {
  return useApiQuery<BrandsListResponse>(fetchBrandsDetails);
}
