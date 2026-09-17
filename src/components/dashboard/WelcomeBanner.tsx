import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ClipboardCheck, Hourglass } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { ProgressRing } from '../common/ProgressRing';
import { useToday } from '../../lib/useToday';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { useProfileStore, titleForLevel, styleForLevel } from '../../stores/useProfileStore';
import { cn } from '../../lib/utils';

export function WelcomeBanner() {
  const tasks = useTaskStore((s) => s.tasks);
  const focusMinutesToday = usePomodoroStore((s) => s.focusMinutesToday);
  const name = useProfileStore((s) => s.profile.name);
  const level = useProfileStore((s) => s.profile.level);
  const levelStyle = styleForLevel(level);
  const today = useToday();

  const { pendingToday, progressPercent } = useMemo(() => {
    const relevant = tasks.filter((t) => t.dueDate === today || t.status !== 'backlog');
    const pending = tasks.filter((t) => t.status !== 'completed' && t.dueDate === today).length;
    const total = relevant.length || tasks.length;
    const done = relevant.filter((t) => t.status === 'completed').length || tasks.filter((t) => t.status === 'completed').length;
    return { pendingToday: pending, progressPercent: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks, today]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <section className="w-full bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text tracking-tight flex items-center flex-wrap gap-2">
            <span>
              {/* O nome é o único pedaço pessoal do cabeçalho, então ganha a cor de
                  destaque; a saudação, que é sempre a mesma, fica no tom neutro. */}
              👋 {greeting}
              {name ? ', ' : ''}
              <span className="text-primary">{name}</span>
              !
            </span>
            <span
              style={{ '--level-glow': levelStyle.glow } as CSSProperties}
              className={cn(
                'level-badge text-xs font-semibold px-2 py-0.5 rounded-full text-slate-900 bg-gradient-to-r shadow-sm align-middle',
                levelStyle.gradient
              )}
            >
              Nível {level} · {titleForLevel(level)}
            </span>
          </h1>
          <p className="text-sm text-text-muted">
            Você tem {pendingToday} tarefa{pendingToday === 1 ? '' : 's'} para hoje. Mantenha o ritmo calmo e cadenciado.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-[300px] lg:min-w-[440px]">
          <StatCard label="Tarefas Hoje" value={`${pendingToday} Pendentes`} icon={<ClipboardCheck size={18} />} />
          <StatCard label="Foco Acumulado" value={`${focusMinutesToday} min`} icon={<Hourglass size={18} />} highlight />
          <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">Progresso Geral</span>
              <span className="text-lg font-semibold text-text">{progressPercent}%</span>
            </div>
            <ProgressRing percent={progressPercent} size={36} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string; icon: ReactNode; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-text-muted block">{label}</span>
        <span className={cn('text-lg font-semibold truncate block', highlight ? 'text-primary' : 'text-text')}>{value}</span>
      </div>
      <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
    </div>
  );
}
