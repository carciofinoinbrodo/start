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
          <div className="relative group">
            <button className="relative p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-all duration-200">
              <Bell className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-muted)] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              Coming soon
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
