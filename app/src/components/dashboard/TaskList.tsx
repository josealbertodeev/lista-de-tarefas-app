import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ListChecks, CheckCircle2, Trash2 } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTaskFilterStore } from '../../stores/useTaskFilterStore';
import { TaskItem } from './TaskItem';
import { TaskFilters } from './TaskFilters';
import { cn } from '../../lib/utils';
import { useToday } from '../../lib/useToday';
import { filterSortTasks, isFilterActive } from '../../lib/taskQuery';
import { ConfirmDialog } from '../modals/Modal';

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks);
  const clearCompletedTasks = useTaskStore((s) => s.clearCompletedTasks);
  const [confirmClear, setConfirmClear] = useState(false);
  const today = useToday();

  const tab = useTaskFilterStore((s) => s.tab);
  const setTab = useTaskFilterStore((s) => s.setTab);
  const query = useTaskFilterStore((s) => s.query);
  const categories = useTaskFilterStore((s) => s.categories);
  const priorities = useTaskFilterStore((s) => s.priorities);
  const onlyFavorites = useTaskFilterStore((s) => s.onlyFavorites);
  const onlyOverdue = useTaskFilterStore((s) => s.onlyOverdue);
  const sort = useTaskFilterStore((s) => s.sort);
  const dir = useTaskFilterStore((s) => s.dir);

  const filters = useMemo(
    () => ({ query, categories, priorities, onlyFavorites, onlyOverdue, sort, dir }),
    [query, categories, priorities, onlyFavorites, onlyOverdue, sort, dir]
  );

  const totals = useMemo(
    () => ({
      pending: tasks.filter((t) => t.status !== 'completed').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    }),
    [tasks]
  );

  const list = useMemo(() => filterSortTasks(tasks, filters, tab, today), [tasks, filters, tab, today]);

  const totalInTab = tab === 'pending' ? totals.pending : totals.completed;
  const filtering = isFilterActive(filters);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-hover border border-border">
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} icon={<ListChecks size={14} />} label="Pendentes" count={totals.pending} />
          <TabButton active={tab === 'completed'} onClick={() => setTab('completed')} icon={<CheckCircle2 size={14} />} label="Concluídas" count={totals.completed} />
        </div>
        {tab === 'completed' && totals.completed > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors"
            title="Limpar concluídas"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <TaskFilters shown={list.length} total={totalInTab} />

      {list.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">
          {filtering
            ? 'Nenhuma tarefa corresponde aos filtros.'
            : tab === 'pending'
              ? 'Nenhuma tarefa pendente 🎉'
              : 'Nenhuma tarefa concluída ainda'}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearCompletedTasks}
        title="Limpar Concluídas?"
        message="Todas as tarefas concluídas serão apagadas. Você poderá desfazer logo em seguida."
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text'
      )}
    >
      {icon}
      {label}
      <span className={cn('text-xs px-1.5 rounded-full', active ? 'bg-primary/10 text-primary' : 'bg-surface text-text-muted')}>{count}</span>
    </button>
  );
}
