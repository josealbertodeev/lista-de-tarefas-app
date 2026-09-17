import { TrendingUp } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { useToday } from '../../lib/useToday';

export function DailyGoalCard() {
  const tasks = useTaskStore((s) => s.tasks);
  const target = useProfileStore((s) => s.profile.dailyTaskTarget);
  const today = useToday();

  const todayTasks = tasks.filter((t) => t.dueDate === today);
  const done = todayTasks.filter((t) => t.status === 'completed').length;
  const percent = Math.min(100, Math.round((done / target) * 100));
  const remaining = Math.max(0, target - done);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-text">
          <TrendingUp className="text-primary" size={20} />
          <h2 className="font-semibold">Meta de Conclusão Diária</h2>
        </div>
        <span className="text-sm text-text-muted">
          <span className="text-primary font-semibold">{done}</span> de {target} concluídas · {percent}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden mb-2">
        <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-text-muted">
        {remaining > 0 ? `⚡ Restam ${remaining} tarefa${remaining === 1 ? '' : 's'} para atingir a meta do dia.` : '🎉 Meta diária atingida!'}
      </p>
    </div>
  );
}
