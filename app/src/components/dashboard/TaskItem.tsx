import { useState } from 'react';
import { Star, Pencil, Trash2, Clock, Timer } from 'lucide-react';
import type { Task } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { CategoryBadge, PriorityBadge } from '../common/Badge';
import { cn, isToday, isPast, formatDateBR } from '../../lib/utils';
import { EditTaskModal } from '../modals/EditTaskModal';
import { ConfirmDialog } from '../modals/Modal';
import { playTaskCompleteSound } from '../../lib/audio';

export function TaskItem({ task }: { task: Task }) {
  const { toggleTaskCompletion, toggleFavorite, deleteTask } = useTaskStore();
  const { setActiveTask, activeTaskId } = usePomodoroStore();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const completed = task.status === 'completed';
  const isActiveFocus = activeTaskId === task.id;

  const overdue = !completed && isPast(task.dueDate);
  const dueLabel = task.dueDate ? (isToday(task.dueDate) ? 'Hoje' : formatDateBR(task.dueDate)) : null;
  const subtaskProgress = task.subtasks.length
    ? Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100)
    : null;

  const handleToggle = () => {
    if (!completed) playTaskCompleteSound();
    toggleTaskCompletion(task.id);
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl border transition-colors',
        completed ? 'bg-surface-hover/50 border-border' : 'bg-surface-hover border-border hover:border-primary/30',
        isActiveFocus && 'ring-1 ring-primary/40'
      )}
    >
      <button
        onClick={handleToggle}
        className={cn(
          'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
          completed ? 'bg-primary border-primary text-white' : 'border-text-muted hover:border-primary'
        )}
      >
        {completed && <span className="text-[10px]">✓</span>}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium text-text', completed && 'line-through text-text-muted strike-animate')}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <CategoryBadge category={task.category} />
          {!completed && <PriorityBadge priority={task.priority} />}
          {dueLabel && (
            <span className={cn('inline-flex items-center gap-1 text-xs', overdue ? 'text-red-400' : 'text-text-muted')}>
              <Clock size={11} />
              {dueLabel}
              {task.dueTime && ` ${task.dueTime}`}
            </span>
          )}
          {subtaskProgress !== null && (
            <span className="text-xs text-text-muted">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtarefas
            </span>
          )}
          {task.pomodoroEstimate > 0 && (
            <button
              onClick={() => setActiveTask(isActiveFocus ? undefined : task.id)}
              className={cn(
                'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border transition-colors',
                isActiveFocus ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-text-muted hover:text-primary'
              )}
            >
              <Timer size={11} />
              {task.pomodorosCompleted}/{task.pomodoroEstimate}
            </button>
          )}
        </div>
        {subtaskProgress !== null && (
          <div className="mt-2 h-1 w-full rounded-full bg-surface overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${subtaskProgress}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => toggleFavorite(task.id)}
          className={cn('p-1.5 rounded-lg hover:bg-surface transition-colors', task.isFavorite ? 'text-yellow-400' : 'text-text-muted')}
        >
          <Star size={15} fill={task.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-text-muted hover:bg-surface hover:text-text transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-text-muted hover:bg-surface hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      <EditTaskModal open={editing} onClose={() => setEditing(false)} task={task} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteTask(task.id)}
        title="Excluir Tarefa?"
        message="Tem certeza que deseja apagar esta tarefa? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
