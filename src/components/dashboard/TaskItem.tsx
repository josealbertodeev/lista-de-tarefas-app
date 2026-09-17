import { memo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Star, Pencil, Trash2, Clock, Timer, GripVertical } from 'lucide-react';
import type { Task } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { CategoryBadge, PriorityBadge } from '../common/Badge';
import { cn, isToday, isPast, formatDateBR } from '../../lib/utils';
import { EditTaskModal } from '../modals/EditTaskModal';
import { playTaskCompleteSound } from '../../lib/audio';

interface TaskItemProps {
  task: Task;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging?: boolean;
  style?: CSSProperties;
}

function TaskItemComponent({ task, dragHandleProps, isDragging, style }: TaskItemProps) {
  // Um seletor por ação em vez de desestruturar o store inteiro: como estava, cada
  // linha assinava todas as mudanças do store e a lista inteira re-renderizava a
  // cada edição. Ações do zustand têm referência estável, então isto não custa nada.
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const toggleFavorite = useTaskStore((s) => s.toggleFavorite);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const setActiveTask = usePomodoroStore((s) => s.setActiveTask);
  const activeTaskId = usePomodoroStore((s) => s.activeTaskId);
  const [editing, setEditing] = useState(false);
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
      style={style}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl border transition-colors',
        // A cor da borda diz o estado da tarefa antes de qualquer leitura: âmbar
        // para pendente, vermelho quando o prazo passou, verde para concluída.
        completed
          ? 'bg-emerald-500/[0.07] border-emerald-500/40'
          : overdue
            ? 'bg-red-500/[0.06] border-red-500/40 hover:border-red-500/70'
            : 'bg-amber-400/[0.06] border-amber-400/40 hover:bg-amber-400/10 hover:border-amber-400/70',
        isActiveFocus && 'ring-1 ring-primary/40',
        isDragging && 'shadow-lg ring-1 ring-primary/40 bg-surface'
      )}
    >
      {dragHandleProps && (
        <button
          {...dragHandleProps}
          title="Arrastar para reordenar"
          aria-label="Arrastar para reordenar"
          className="mt-0.5 p-0.5 rounded text-text-muted/0 group-hover:text-text-muted hover:text-text cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        >
          <GripVertical size={15} />
        </button>
      )}

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
        <p
          className={cn(
            'text-sm font-medium text-text',
            // w-fit: o risco animado é um ::after de 100% da largura e, num <p> de
            // bloco, ele se esticava até a borda do cartão. Com fit-content a linha
            // para no fim do texto e ainda quebra junto com um título comprido.
            completed && 'line-through text-text-muted strike-animate w-fit max-w-full'
          )}
        >
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

      <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => toggleFavorite(task.id)}
          title={task.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorita'}
          aria-label={task.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorita'}
          className="p-1.5 rounded-lg text-yellow-400 hover:bg-surface transition-colors"
        >
          <Star size={15} fill={task.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => setEditing(true)}
          title="Editar tarefa"
          aria-label="Editar tarefa"
          className="p-1.5 rounded-lg text-blue-400 hover:bg-surface transition-colors"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          title="Excluir tarefa"
          aria-label="Excluir tarefa"
          className="p-1.5 rounded-lg text-red-400 hover:bg-surface transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <EditTaskModal open={editing} onClose={() => setEditing(false)} task={task} />
    </div>
  );
}

// memo evita repintar todas as linhas quando apenas uma tarefa muda.
export const TaskItem = memo(TaskItemComponent);
