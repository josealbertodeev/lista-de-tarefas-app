import { useState } from 'react';
import { Trash2, Pencil, Check } from 'lucide-react';
import type { Goal } from '../../types';
import { CategoryBadge } from '../common/Badge';
import { useTaskStore } from '../../stores/useTaskStore';
import { ConfirmDialog } from '../modals/Modal';
import { clamp } from '../../lib/utils';

export function GoalCard({ goal }: { goal: Goal }) {
  const updateGoal = useTaskStore((s) => s.updateGoal);
  const deleteGoal = useTaskStore((s) => s.deleteGoal);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingMetric, setEditingMetric] = useState(false);

  const daysLeft = Math.ceil((new Date(goal.deadline + 'T00:00:00').getTime() - Date.now()) / 86400000);

  const bumpMetric = (delta: number) => {
    if (!goal.targetMetric) return;
    const current = clamp(goal.targetMetric.current + delta, 0, goal.targetMetric.target);
    const progress = Math.round((current / goal.targetMetric.target) * 100);
    updateGoal(goal.id, { targetMetric: { ...goal.targetMetric, current }, progress });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <CategoryBadge category={goal.category} className="mb-1.5" />
          <h3 className="font-semibold text-text leading-snug">{goal.title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditingMetric((v) => !v)} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text">
            <Pencil size={14} />
          </button>
          <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-red-400">
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
          <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
      </div>

      {goal.targetMetric && (
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>
            {goal.targetMetric.current} / {goal.targetMetric.target} {goal.targetMetric.unit}
          </span>
          {editingMetric && (
            <div className="flex gap-1">
              <button onClick={() => bumpMetric(-1)} className="w-6 h-6 rounded-md bg-surface-hover border border-border">
                -
              </button>
              <button onClick={() => bumpMetric(1)} className="w-6 h-6 rounded-md bg-surface-hover border border-border">
                +
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className={daysLeft < 3 ? 'text-red-400 font-medium' : 'text-text-muted'}>
          {daysLeft > 0 ? `${daysLeft} dias restantes` : daysLeft === 0 ? 'Prazo é hoje!' : 'Prazo vencido'}
        </span>
        {goal.progress < 100 ? (
          <button onClick={() => updateGoal(goal.id, { progress: 100 })} className="flex items-center gap-1 text-primary font-medium hover:underline">
            <Check size={12} /> Concluir
          </button>
        ) : (
          <span className="text-primary font-medium">✓ Concluída</span>
        )}
      </div>

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
