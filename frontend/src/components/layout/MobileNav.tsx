import { Menu } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function MobileNav() {
  const { toggleSidebar } = useApp();

  return (
    <button
      onClick={toggleSidebar}
      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-all"
      aria-label="Toggle navigation menu"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
