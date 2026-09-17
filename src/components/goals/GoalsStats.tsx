import { useMemo, useState } from 'react';
import { Hourglass, CheckCircle2, TrendingUp, Flame, Plus, Trophy } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useProfileStore, titleForLevel } from '../../stores/useProfileStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { WeeklyProductivityChart, CategoryBreakdownChart } from './StatsCharts';
import { GoalCard } from './GoalCard';
import { NewGoalModal } from '../modals/NewGoalModal';
import { xpForLevel, isoFromTimestamp } from '../../lib/utils';
import { useToday } from '../../lib/useToday';

export function GoalsStats() {
  const tasks = useTaskStore((s) => s.tasks);
  const goals = useTaskStore((s) => s.goals);
  const profile = useProfileStore((s) => s.profile);
  const focusMinutesToday = usePomodoroStore((s) => s.focusMinutesToday);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const today = useToday();

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const efficiency = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const totalFocusHours = (tasks.reduce((sum, t) => sum + t.pomodorosCompleted, 0) * profile.focusMinutes) / 60;

  const todayDone = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && isoFromTimestamp(t.completedAt) === today
  ).length;
  const dailyChallengeTarget = 3;
  const need = xpForLevel(profile.level);

  const kpis = [
    { label: 'Horas Focadas', value: totalFocusHours.toFixed(1), icon: Hourglass, color: 'text-primary' },
    { label: 'Tarefas Concluídas', value: String(completedTasks.length), icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Taxa de Eficiência', value: `${efficiency}%`, icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Sequência (Streak)', value: `${profile.streakDays} dias`, icon: Flame, color: 'text-orange-400' },
  ];

  const sortedGoals = useMemo(() => [...goals].sort((a, b) => a.deadline.localeCompare(b.deadline)), [goals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-text mb-1">Metas & Estatísticas</h1>
      <p className="text-sm text-text-muted mb-5">Acompanhe sua produtividade e evolua de nível.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase text-text-muted block">{kpi.label}</span>
              <span className="text-lg font-bold text-text">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <WeeklyProductivityChart />
        <CategoryBreakdownChart />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} /> Conquistas e Gamificação
          </h3>
          <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
            Nível {profile.level} · {titleForLevel(profile.level)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>XP para o próximo nível</span>
              <span className="font-mono text-text">
                {profile.xp} / {need} XP
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-hover overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" style={{ width: `${Math.min(100, (profile.xp / need) * 100)}%` }} />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-hover border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text">🎯 Desafio Diário</span>
              <span className="text-xs text-primary font-semibold">+100 XP</span>
            </div>
            <p className="text-xs text-text-muted mb-1.5">Complete {dailyChallengeTarget} tarefas hoje</p>
            <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (todayDone / dailyChallengeTarget) * 100)}%` }} />
            </div>
            <span className="text-[10px] text-text-muted">
              {todayDone} / {dailyChallengeTarget}
            </span>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-3">🔥 {focusMinutesToday} minutos de foco acumulados hoje.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">🎯 Metas e Objetivos</h2>
        <button
          onClick={() => setShowGoalModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium text-sm transition-colors"
        >
          <Plus size={16} /> Nova Meta
        </button>
      </div>

      {sortedGoals.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-sm text-text-muted">
          Nenhuma meta criada. Comece adicionando uma meta!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGoals.map((goal, i) => (
            <GoalCard key={goal.id} goal={goal} index={i} />
          ))}
        </div>
      )}

      <NewGoalModal open={showGoalModal} onClose={() => setShowGoalModal(false)} />
    </div>
  );
}
