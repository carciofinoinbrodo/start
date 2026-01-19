import { FileText, Building2, Globe } from 'lucide-react';
import type { SearchResult } from '../../types';

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

const categoryIcons = {
  prompts: FileText,
  brands: Building2,
  sources: Globe,
};

export function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const Icon = categoryIcons[result.category];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-150 ${
        isSelected
          ? 'bg-[var(--accent-glow)] text-[var(--accent-secondary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]'
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: result.color ? `${result.color}20` : 'var(--bg-elevated)',
        }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: result.color || 'var(--text-muted)' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-[var(--text-muted)] truncate">{result.subtitle}</p>
        )}
      </div>
    </button>
  );
}
