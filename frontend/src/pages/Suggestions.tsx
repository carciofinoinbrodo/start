import { Header } from '../components/layout/Header';
import { KanbanBoard } from '../components/geo';

export function Suggestions() {
  const brandId = 'wix';

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Header
        title="GEO Strategy Advisor"
        subtitle="AI-powered insights for AI search visibility"
      />

      <div className="p-4 md:p-6 lg:p-8">
        <KanbanBoard brandId={brandId} />
      </div>
    </div>
  );
}
