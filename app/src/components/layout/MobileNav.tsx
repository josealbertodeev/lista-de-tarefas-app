import { ListChecks, Kanban, CalendarDays, Target, User, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AppView } from '../../App';

const TABS: { key: AppView; label: string; icon: typeof ListChecks }[] = [
  { key: 'dashboard', label: 'Tarefas', icon: ListChecks },
  { key: 'kanban', label: 'Quadro', icon: Kanban },
  { key: 'calendar', label: 'Calendário', icon: CalendarDays },
  { key: 'goals', label: 'Metas', icon: Target },
  { key: 'settings', label: 'Perfil', icon: User },
];

export function MobileNav({
  view,
  onNavigate,
  onQuickAdd,
}: {
  view: AppView;
  onNavigate: (v: AppView) => void;
  onQuickAdd: () => void;
}) {
  return (
    <>
      <button
        onClick={onQuickAdd}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Nova Tarefa"
      >
        <Plus size={26} />
      </button>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-text-muted'
              )}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
