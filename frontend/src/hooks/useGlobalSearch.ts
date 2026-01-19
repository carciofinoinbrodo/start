import { useMemo } from 'react';
import { prompts, brands, sources } from '../data/mockData';
import type { SearchResultGroup, SearchResult } from '../types';

const MAX_RESULTS_PER_CATEGORY = 5;

export function useGlobalSearch(query: string) {
  const results = useMemo<SearchResultGroup[]>(() => {
    if (!query || query.length < 2) return [];

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
  }, [query]);

  const totalResults = results.reduce((sum, group) => sum + group.results.length, 0);

  return { results, totalResults };
}
