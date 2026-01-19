import { Settings as SettingsIcon } from 'lucide-react';
import { Header } from '../components/layout/Header';

export function Settings() {
  return (
    <div className="min-h-screen">
      <Header
        title="Settings"
        subtitle="Configure your tracking preferences"
      />

      <div className="p-4 md:p-8">
        <div className="glass-card p-12 text-center animate-fade-in-up">
          <div className="icon-glow mx-auto mb-4 w-fit">
            <SettingsIcon className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Settings Page
          </h3>
          <p className="text-[var(--text-muted)]">
            Configuration options coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
