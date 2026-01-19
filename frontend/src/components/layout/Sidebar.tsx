import { NavLink } from 'react-router';
import { LayoutDashboard, MessageSquareText, Settings, X } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prompts', icon: MessageSquareText, label: 'Prompts' },
];

interface SidebarProps {
  variant?: 'static' | 'overlay';
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ variant = 'static', isOpen = true, onClose }: SidebarProps) {
  const isOverlay = variant === 'overlay';

  const sidebarClasses = [
    'w-64 min-h-screen flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl',
    isOverlay && 'fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-out shadow-2xl',
    isOverlay && !isOpen && '-translate-x-full',
    isOverlay && isOpen && 'translate-x-0',
    !isOverlay && 'animate-slide-in-left',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      {/* Logo Section */}
      <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center animate-pulse-glow">
            <span className="text-white font-bold text-sm tracking-tight">AI</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[var(--text-primary)] text-base tracking-tight">SEO Tracker</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Analytics</span>
          </div>
        </div>

        {/* Close button for overlay mode */}
        {isOverlay && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-all"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li key={item.to} className="animate-fade-in-up" style={{ animationDelay: `${150 + index * 50}ms` }}>
              <NavLink
                to={item.to}
                onClick={isOverlay ? onClose : undefined}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <button className="sidebar-nav-item w-full">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </aside>
  );
}
