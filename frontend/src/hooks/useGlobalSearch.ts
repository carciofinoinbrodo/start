import { useMemo } from 'react';
import { useBrands, usePrompts, useSources } from './useApi';
import type { SearchResultGroup, SearchResult } from '../types';

const MAX_RESULTS_PER_CATEGORY = 5;

export function useGlobalSearch(query: string) {
  const { data: prompts } = usePrompts();
  const { data: brands } = useBrands();
  const { data: sources } = useSources();

  const results = useMemo<SearchResultGroup[]>(() => {
    if (!query || query.length < 2) return [];
    if (!prompts || !brands || !sources) return [];

    const normalizedQuery = query.toLowerCase().trim();

    const promptResults: SearchResult[] = prompts
      .filter((p) => p.query.toLowerCase().includes(normalizedQuery))
      .slice(0, MAX_RESULTS_PER_CATEGORY)
      .map((p) => ({
        id: p.id,
        category: 'prompts' as const,
        title: p.query,
        subtitle: `${p.visibility}% visibility`,
        href: `/prompts?highlight=${p.id}`,
      }));

    const brandResults: SearchResult[] = brands
      .filter((b) => b.name.toLowerCase().includes(normalizedQuery))
      .slice(0, MAX_RESULTS_PER_CATEGORY)
      .map((b) => ({
        id: b.id,
        category: 'brands' as const,
        title: b.name,
        subtitle: `${b.visibility}% visibility`,
        href: `/?brand=${b.id}`,
        color: b.color,
      }));

    const sourceResults: SearchResult[] = sources
      .filter((s) => s.domain.toLowerCase().includes(normalizedQuery))
      .slice(0, MAX_RESULTS_PER_CATEGORY)
      .map((s) => ({
        id: s.domain,
        category: 'sources' as const,
        title: s.domain,
        subtitle: `${s.usage}% usage`,
        href: `/?source=${s.domain}`,
      }));

    const groups: SearchResultGroup[] = [];

    if (promptResults.length > 0) {
      groups.push({ category: 'prompts', label: 'Prompts', results: promptResults });
    }
    if (brandResults.length > 0) {
      groups.push({ category: 'brands', label: 'Brands', results: brandResults });
    }
    if (sourceResults.length > 0) {
      groups.push({ category: 'sources', label: 'Sources', results: sourceResults });
    }

    return groups;
  }, [query, prompts, brands, sources]);

  const totalResults = results.reduce((sum, group) => sum + group.results.length, 0);

  return { results, totalResults };
}
