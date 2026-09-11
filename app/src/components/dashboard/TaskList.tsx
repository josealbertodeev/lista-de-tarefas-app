import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ListChecks, CheckCircle2, Trash2 } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { TaskItem } from './TaskItem';
import { cn } from '../../lib/utils';
import { ConfirmDialog } from '../modals/Modal';
import { PRIORITIES } from '../../types';

const PRIORITY_ORDER = Object.fromEntries(PRIORITIES.map((p, i) => [p, i]));

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks);
  const clearCompletedTasks = useTaskStore((s) => s.clearCompletedTasks);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [confirmClear, setConfirmClear] = useState(false);

  const pending = useMemo(
    () => [...tasks].filter((t) => t.status !== 'completed').sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]),
    [tasks]
  );
  const completed = useMemo(
    () => [...tasks].filter((t) => t.status === 'completed').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [tasks]
  );

  const list = tab === 'pending' ? pending : completed;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-hover border border-border">
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} icon={<ListChecks size={14} />} label="Pendentes" count={pending.length} />
          <TabButton active={tab === 'completed'} onClick={() => setTab('completed')} icon={<CheckCircle2 size={14} />} label="Concluídas" count={completed.length} />
        </div>
        {tab === 'completed' && completed.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors"
            title="Limpar concluídas"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">
          {tab === 'pending' ? 'Nenhuma tarefa pendente 🎉' : 'Nenhuma tarefa concluída ainda'}
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
        message="Todas as tarefas concluídas serão apagadas permanentemente."
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
