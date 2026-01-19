import type { Brand } from '../../types';

interface BrandComparisonToggleProps {
  brands: Brand[];
  selectedBrands: string[];
  onToggle: (brandId: string) => void;
  maxSelection?: number;
}

export function BrandComparisonToggle({
  brands,
  selectedBrands,
  onToggle,
  maxSelection = 2,
}: BrandComparisonToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-[var(--bg-elevated)] rounded-lg">
      <span className="text-xs text-[var(--text-muted)] mr-2">
        Select up to {maxSelection} brands:
      </span>
      {brands.map((brand) => {
        const isSelected = selectedBrands.includes(brand.id);
        const isDisabled = !isSelected && selectedBrands.length >= maxSelection;

        return (
          <button
            key={brand.id}
            onClick={() => !isDisabled && onToggle(brand.id)}
            disabled={isDisabled}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${isSelected
                ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-elevated)]'
                : isDisabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[var(--glass-bg)]'
              }
            `}
            style={{
              backgroundColor: isSelected ? `${brand.color}20` : 'transparent',
              color: isSelected ? brand.color : 'var(--text-secondary)',
              // @ts-expect-error CSS custom property
              '--tw-ring-color': isSelected ? brand.color : undefined,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: brand.color }}
            />
            {brand.name}
          </button>
        );
      })}
    </div>
  );
}
