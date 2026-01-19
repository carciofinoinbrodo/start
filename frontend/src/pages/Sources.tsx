import { Globe } from 'lucide-react';
import { Header } from '../components/layout/Header';

export function Sources() {
  return (
    <div className="min-h-screen">
      <Header
        title="Sources"
        subtitle="View all sources cited by AI search engines"
      />

      <div className="p-4 md:p-8">
        <div className="glass-card p-12 text-center animate-fade-in-up">
          <div className="icon-glow mx-auto mb-4 w-fit">
            <Globe className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Sources Page
          </h3>
          <p className="text-[var(--text-muted)]">
            This page will display all sources cited across your tracked prompts.
          </p>
        </div>
      </div>
    </div>
  );
}
