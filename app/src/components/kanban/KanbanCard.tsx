import { Draggable } from '@hello-pangea/dnd';
import { Clock, Timer } from 'lucide-react';
import type { Task } from '../../types';
import { CategoryBadge, PriorityBadge } from '../common/Badge';
import { cn, isToday } from '../../lib/utils';

export function KanbanCard({ task, index }: { task: Task; index: number }) {
  const subtaskProgress = task.subtasks.length
    ? Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100)
    : null;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'p-3.5 rounded-xl bg-surface border border-border shadow-sm cursor-grab active:cursor-grabbing transition-shadow',
            snapshot.isDragging && 'shadow-lg ring-1 ring-primary/40',
            task.isCriticalPath && 'border-l-2 border-l-red-400'
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <CategoryBadge category={task.category} />
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="text-sm font-medium text-text mb-2 leading-snug">{task.title}</p>

          {subtaskProgress !== null && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                <span>
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} concluídos
                </span>
                <span>{subtaskProgress}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-surface-hover overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${subtaskProgress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-text-muted">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {isToday(task.dueDate) ? 'Hoje' : task.dueDate}
                {task.dueTime && `, ${task.dueTime}`}
              </span>
            )}
            {task.pomodoroEstimate > 0 && (
              <span className="flex items-center gap-1">
                <Timer size={12} />
                {task.pomodorosCompleted}/{task.pomodoroEstimate}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
