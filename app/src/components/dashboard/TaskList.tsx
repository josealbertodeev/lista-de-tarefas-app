import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { ListChecks, CheckCircle2, Trash2 } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTaskFilterStore } from '../../stores/useTaskFilterStore';
import { TaskItem } from './TaskItem';
import { cn } from '../../lib/utils';
import { useToday } from '../../lib/useToday';
import { filterSortTasks } from '../../lib/taskQuery';
import type { TaskFilters } from '../../lib/taskQuery';
import { ConfirmDialog } from '../modals/Modal';

const COMPLETED_FILTERS: TaskFilters = {
  query: '',
  categories: [],
  priorities: [],
  onlyFavorites: false,
  onlyOverdue: false,
  sort: 'priority',
  dir: 'desc',
};

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks);
  const clearCompletedTasks = useTaskStore((s) => s.clearCompletedTasks);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const [confirmClear, setConfirmClear] = useState(false);
  const today = useToday();

  const tab = useTaskFilterStore((s) => s.tab);
  const setTab = useTaskFilterStore((s) => s.setTab);

  const totals = useMemo(
    () => ({
      pending: tasks.filter((t) => t.status !== 'completed').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    }),
    [tasks]
  );

  // Pendentes ficam na ordem que o usuário arrastar; concluídas seguem sempre por data de conclusão.
  const list = useMemo(
    () => (tab === 'pending' ? tasks.filter((t) => t.status !== 'completed') : filterSortTasks(tasks, COMPLETED_FILTERS, tab, today)),
    [tasks, tab, today]
  );

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = [...list];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    reorderTasks(reordered.map((t) => t.id));
  };

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

      {list.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">
          {tab === 'pending' ? 'Nenhuma tarefa pendente 🎉' : 'Nenhuma tarefa concluída ainda'}
        </div>
      ) : tab === 'pending' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="pending-tasks">
            {(provided) => (
              <div className="space-y-2" ref={provided.innerRef} {...provided.droppableProps}>
                {list.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                        <TaskItem task={task} dragHandleProps={dragProvided.dragHandleProps} isDragging={dragSnapshot.isDragging} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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
