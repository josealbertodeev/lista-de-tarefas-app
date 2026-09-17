import { useState } from 'react';
import { Trash2, Pencil, Check, Minus, Plus } from 'lucide-react';
import type { Goal } from '../../types';
import { CategoryBadge } from '../common/Badge';
import { useTaskStore } from '../../stores/useTaskStore';
import { ConfirmDialog } from '../modals/Modal';
import { NewGoalModal } from '../modals/NewGoalModal';
import { clamp, cn } from '../../lib/utils';

export function GoalCard({ goal, index = 0 }: { goal: Goal; index?: number }) {
  const updateGoal = useTaskStore((s) => s.updateGoal);
  const deleteGoal = useTaskStore((s) => s.deleteGoal);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const daysLeft = Math.ceil((new Date(goal.deadline + 'T00:00:00').getTime() - Date.now()) / 86400000);
  const done = goal.progress >= 100;

  const bumpMetric = (delta: number) => {
    if (!goal.targetMetric) return;
    const current = clamp(goal.targetMetric.current + delta, 0, goal.targetMetric.target);
    const progress = Math.round((current / goal.targetMetric.target) * 100);
    updateGoal(goal.id, { targetMetric: { ...goal.targetMetric, current }, progress });
  };

  return (
    <div
      className={cn(
        'group rounded-2xl p-5 shadow-sm card-rise hover-lift border',
        // Meta fechada troca a borda neutra por verde: dá para varrer a lista e ver
        // o que já foi conquistado sem ler o percentual de cada cartão.
        done ? 'bg-emerald-500/[0.07] border-emerald-500/50' : 'bg-surface border-border'
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <CategoryBadge category={goal.category} className="mb-1.5" />
          <h3 className="font-semibold text-text leading-snug group-hover:text-primary transition-colors">{goal.title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            title="Editar meta"
            aria-label="Editar meta"
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Excluir meta"
            aria-label="Excluir meta"
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {goal.description && <p className="text-xs text-text-muted mb-3">{goal.description}</p>}

      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>Progresso</span>
          <span className="font-semibold text-text">{goal.progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
          <div
            className="relative h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full progress-fill"
            style={{ width: `${goal.progress}%` }}
          >
            {!done && goal.progress > 0 && <span className="absolute inset-0 rounded-full progress-shimmer" />}
          </div>
        </div>
      </div>

      {goal.targetMetric && (
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>
            <span className="font-semibold text-text">{goal.targetMetric.current}</span> / {goal.targetMetric.target}{' '}
            {goal.targetMetric.unit}
          </span>
          <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => bumpMetric(-1)}
              title="Diminuir 1"
              aria-label="Diminuir 1"
              className="w-6 h-6 rounded-md bg-surface-hover border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-primary/40 transition-colors"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={() => bumpMetric(1)}
              title="Aumentar 1"
              aria-label="Aumentar 1"
              className="w-6 h-6 rounded-md bg-surface-hover border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className={cn(daysLeft < 3 && !done ? 'text-red-400 font-medium' : 'text-text-muted')}>
          {daysLeft > 0 ? `${daysLeft} dias restantes` : daysLeft === 0 ? 'Prazo é hoje!' : 'Prazo vencido'}
        </span>
        {!done ? (
          <button onClick={() => updateGoal(goal.id, { progress: 100 })} className="flex items-center gap-1 text-primary font-medium hover:underline">
            <Check size={12} /> Concluir
          </button>
        ) : (
          <span className="text-primary font-medium">✓ Concluída</span>
        )}
      </div>

      <NewGoalModal open={editing} onClose={() => setEditing(false)} goal={goal} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteGoal(goal.id)}
        title="Excluir Meta?"
        message="Tem certeza que deseja apagar esta meta?"
      />
    </div>
  );
}
