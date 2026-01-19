import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Command } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useClickOutside } from '../../hooks/useClickOutside';
import { SearchResults } from './SearchResults';
import type { SearchResult } from '../../types';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);
  const { results, totalResults } = useGlobalSearch(debouncedQuery);

  // Flatten results for keyboard navigation
  const flatResults = results.flatMap((group) => group.results);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  // Open dropdown when results exist
  useEffect(() => {
    setIsOpen(debouncedQuery.length >= 2 && totalResults > 0);
    setSelectedIndex(-1);
  }, [debouncedQuery, totalResults]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.href);
    setQuery('');
    setIsOpen(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => debouncedQuery.length >= 2 && totalResults > 0 && setIsOpen(true)}
          placeholder="Search..."
          className="input-dark pr-16 py-2 text-sm w-64"
          style={{ paddingLeft: '2.5rem' }}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded border border-[var(--border-subtle)]">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
}
