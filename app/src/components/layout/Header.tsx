import { useEffect, useState } from 'react';
import { CheckCircle2, Sun, Moon, User } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useProfileStore } from '../../stores/useProfileStore';
import { cn } from '../../lib/utils';
import type { AppView } from '../../App';

const TABS: { key: AppView; label: string }[] = [
  { key: 'dashboard', label: 'Tarefas' },
  { key: 'kanban', label: 'Quadro' },
  { key: 'calendar', label: 'Calendário' },
  { key: 'goals', label: 'Metas' },
  { key: 'achievements', label: 'Conquistas' },
];

export function Header({ view, onNavigate }: { view: AppView; onNavigate: (v: AppView) => void }) {
  const { profile, toggleTheme } = useProfileStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="h-full px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CheckCircle2 className="text-primary" size={18} />
            </div>
            <span className="font-bold text-text hidden sm:inline">Minhas Tarefas</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border text-xs text-text-muted first-letter:uppercase">
            {dateLabel}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm transition-colors',
                view === tab.key
                  ? 'bg-surface-hover text-primary font-semibold border border-primary/20'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-amber-400 transition-colors"
          >
            {profile.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NotificationBell onNavigate={onNavigate} />
          <button
            onClick={() => onNavigate('settings')}
            className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0"
          >
            <User size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
