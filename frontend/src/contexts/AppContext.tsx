import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Theme = 'light' | 'dark';

interface AppContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebar-open', false);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AppContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar, theme, setTheme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
