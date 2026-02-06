import { NavLink } from 'react-router';
import { LayoutDashboard, MessageSquareText, Globe, Tag, Lightbulb, Settings, X, ChevronLeft, ChevronRight, Sparkles, HelpCircle } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prompts', icon: MessageSquareText, label: 'Prompts' },
  { to: '/sources', icon: Globe, label: 'Sources' },
  { to: '/brands', icon: Tag, label: 'Brands' },
  { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
];

interface SidebarProps {
  variant?: 'static' | 'overlay';
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  variant = 'static',
  isOpen = true,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const isOverlay = variant === 'overlay';

  // For overlay mode on mobile, completely hide when not open
  if (isOverlay && !isOpen) {
    return null;
  }

  const sidebarClasses = [
    'h-screen flex flex-col border-r border-[var(--border-visible)] bg-[var(--bg-primary)] transition-all duration-300 ease-out overflow-y-auto',
    isCollapsed ? 'w-16' : 'w-60',
    isOverlay ? 'fixed top-0 left-0 z-50 shadow-lg' : 'sticky top-0',
    !isOverlay && !isCollapsed && 'animate-slide-in-left',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      {/* Logo Section */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <NavLink to="/" className={`flex items-center ${isCollapsed ? '' : 'gap-2.5'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-semibold text-sm">V</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-[var(--text-primary)] text-[15px]">Visyble</span>
          )}
        </NavLink>

        {/* Collapse button for desktop */}
        {!isOverlay && onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Close button for overlay mode */}
        {isOverlay && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {!isOverlay && onToggleCollapse && isCollapsed && (
        <div className="px-2 mb-2">
          <button
            onClick={onToggleCollapse}
            className="sidebar-nav-item w-full justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <ul className="space-y-0.5">
          {navItems.map((item, index) => (
            <li key={item.to} className="animate-fade-in-up" style={{ animationDelay: `${100 + index * 30}ms` }}>
              <NavLink
                to={item.to}
                onClick={isOverlay ? onClose : undefined}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Feature Card - Campsite style with hover effect */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="p-3 rounded-xl bg-[var(--accent-glow)] border border-[var(--border-accent)] hover:border-[var(--accent-primary)]/30 transition-all cursor-default group">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 group-hover:bg-[var(--accent-primary)]/15 transition-colors">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--accent-primary)]">Pro tip</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Add more prompts to improve your AI visibility tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
        <ul className="space-y-0.5">
          <li>
            <NavLink
              to="/settings"
              onClick={isOverlay ? onClose : undefined}
              className={({ isActive }) =>
                `sidebar-nav-item w-full ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Settings className="w-[18px] h-[18px] flex-shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </li>
          {!isCollapsed && (
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-nav-item w-full"
              >
                <HelpCircle className="w-[18px] h-[18px] flex-shrink-0" />
                <span>Help & Support</span>
              </a>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
