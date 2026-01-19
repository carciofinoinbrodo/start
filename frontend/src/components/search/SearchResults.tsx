import type { SearchResultGroup, SearchResult } from '../../types';
import { SearchResultItem } from './SearchResultItem';

interface SearchResultsProps {
  results: SearchResultGroup[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
}

export function SearchResults({ results, selectedIndex, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">No results found</p>
      </div>
    );
  }

  let flatIndex = 0;

  return (
    <div className="py-2 max-h-80 overflow-y-auto">
      {results.map((group) => (
        <div key={group.category} className="mb-2 last:mb-0">
          <div className="px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {group.label}
            </span>
          </div>
          <div className="px-1">
            {group.results.map((result) => {
              const currentIndex = flatIndex++;
              return (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  isSelected={currentIndex === selectedIndex}
                  onClick={() => onSelect(result)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
