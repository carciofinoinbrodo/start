import { Bell } from 'lucide-react';
import { GlobalSearch } from '../search/GlobalSearch';
import { MobileNav } from './MobileNav';
import { useBreakpoint } from '../../hooks/useMediaQuery';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl px-4 md:px-8 py-4 animate-fade-in-down">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && <MobileNav />}
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search - hidden on mobile */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-all duration-200">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--danger)] rounded-full ring-2 ring-[var(--bg-primary)]"></span>
          </button>

          {/* User Avatar */}
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--data-2)] flex items-center justify-center ring-2 ring-[var(--border-subtle)] hover:ring-[var(--border-accent)] transition-all duration-200 cursor-pointer">
              <span className="text-white text-sm font-semibold">JD</span>
            </div>
            <span className="status-dot online absolute -bottom-0.5 -right-0.5 ring-2 ring-[var(--bg-primary)]"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
