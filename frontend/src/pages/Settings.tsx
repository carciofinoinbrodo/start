import { Moon, Sun, Bell, Shield, Database, Palette } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useApp } from '../contexts/AppContext';

interface SettingItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingItem({ icon: Icon, title, description, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-[var(--bg-hover)] flex-shrink-0">
          <Icon className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-all duration-200 flex-shrink-0 active:scale-95 ${
        checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-strong)]'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function Settings() {
  const { theme, setTheme } = useApp();

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Header
        title="Settings"
        subtitle="Configure your preferences"
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
        {/* Appearance Section */}
        <div className="card p-4 sm:p-6 animate-fade-in-up mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 rounded-lg bg-[var(--accent-glow)] flex-shrink-0">
              <Palette className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Appearance</h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">Customize how AiSEO looks</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Theme</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                    : 'border-[var(--border-visible)] hover:border-[var(--border-strong)]'
                }`}
              >
                <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'light' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
                <span className={`text-sm sm:text-base font-medium ${theme === 'light' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  Light
                </span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                    : 'border-[var(--border-visible)] hover:border-[var(--border-strong)]'
                }`}
              >
                <Moon className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
                <span className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  Dark
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="card p-4 sm:p-6 animate-fade-in-up delay-100 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[var(--accent-glow)] flex-shrink-0">
              <Bell className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Notifications</h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">Manage notification preferences</p>
            </div>
          </div>

          <SettingItem
            icon={Bell}
            title="Email notifications"
            description="Updates about brand visibility"
          >
            <ToggleSwitch checked={true} onChange={() => {}} />
          </SettingItem>

          <SettingItem
            icon={Shield}
            title="Weekly reports"
            description="AI visibility summary every week"
          >
            <ToggleSwitch checked={false} onChange={() => {}} />
          </SettingItem>
        </div>

        {/* Data & Privacy Section */}
        <div className="card p-4 sm:p-6 animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[var(--accent-glow)] flex-shrink-0">
              <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Data & Privacy</h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">Control data and privacy</p>
            </div>
          </div>

          <SettingItem
            icon={Database}
            title="Data retention"
            description="Store historical data"
          >
            <ToggleSwitch checked={true} onChange={() => {}} />
          </SettingItem>

          <SettingItem
            icon={Shield}
            title="Analytics sharing"
            description="Anonymous usage data"
          >
            <ToggleSwitch checked={false} onChange={() => {}} />
          </SettingItem>
        </div>
      </div>
    </div>
  );
}
