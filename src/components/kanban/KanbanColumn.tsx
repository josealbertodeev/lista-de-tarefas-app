import { Droppable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '../../types';
import { KanbanCard } from './KanbanCard';
import { cn } from '../../lib/utils';

const DOT_COLOR: Record<TaskStatus, string> = {
  backlog: 'bg-slate-400',
  in_progress: 'bg-amber-400',
  review: 'bg-blue-400',
  completed: 'bg-emerald-400',
};

export function KanbanColumn({ status, title, tasks }: { status: TaskStatus; title: string; tasks: Task[] }) {
  return (
    <div className="flex flex-col w-80 shrink-0 bg-surface-hover/50 border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <span className={cn('w-2 h-2 rounded-full', DOT_COLOR[status])} />
        <h3 className="font-semibold text-sm text-text">{title}</h3>
        <span className="ml-auto text-xs font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded-md border border-border">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn('flex-1 p-3 space-y-3 min-h-[120px] overflow-y-auto max-h-[65vh] transition-colors', snapshot.isDraggingOver && 'bg-primary/5')}
          >
            {tasks.map((t, i) => (
              <KanbanCard key={t.id} task={t} index={i} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && <p className="text-xs text-text-muted text-center py-6">Nenhuma tarefa</p>}
          </div>
        )}
      </Droppable>
    </div>
  );
}
