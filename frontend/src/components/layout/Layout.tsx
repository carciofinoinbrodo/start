import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Backdrop } from './Backdrop';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { useApp } from '../../contexts/AppContext';

export function Layout() {
  const breakpoint = useBreakpoint();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useApp();

  const isMobile = breakpoint === 'mobile' || breakpoint === 'tablet';

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      {/* Desktop: Collapsible sidebar */}
      {!isMobile && (
        <Sidebar
          variant="static"
          isCollapsed={!sidebarOpen}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {/* Mobile/Tablet: Overlay sidebar */}
      {isMobile && (
        <>
          <Backdrop isOpen={sidebarOpen} onClick={() => setSidebarOpen(false)} />
          <Sidebar
            variant="overlay"
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
