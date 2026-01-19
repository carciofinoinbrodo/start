import { Lightbulb } from 'lucide-react';
import { Header } from '../components/layout/Header';

export function Suggestions() {
  return (
    <div className="min-h-screen">
      <Header
        title="Suggestions"
        subtitle="AI-powered recommendations to improve your brand visibility"
      />

      <div className="p-4 md:p-8">
        <div className="glass-card p-12 text-center animate-fade-in-up">
          <div className="icon-glow mx-auto mb-4 w-fit">
            <Lightbulb className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Suggestions Page
          </h3>
          <p className="text-[var(--text-muted)]">
            This page will display personalized suggestions to improve your brand's AI visibility.
          </p>
        </div>
      </div>
    </div>
  );
}
