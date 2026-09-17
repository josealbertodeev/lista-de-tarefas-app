import { Timer, Play, Pause, RotateCcw, Flame, Coffee } from 'lucide-react';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { cn } from '../../lib/utils';

const PHASE_LABEL: Record<string, string> = {
  focus: 'Foco',
  short_break: 'Pausa Curta',
  long_break: 'Pausa Longa',
};

export function PomodoroCard() {
  const { phase, secondsLeft, isRunning, sessionsCompletedToday, focusMinutesToday, breakMinutesToday, activeTaskId } =
    usePomodoroStore();
  const { start, pause, reset, skip } = usePomodoroStore();
  const profile = useProfileStore((s) => s.profile);
  const activeTask = useTaskStore((s) => s.tasks.find((t) => t.id === activeTaskId));

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const totalDuration =
    phase === 'focus' ? profile.focusMinutes * 60 : phase === 'short_break' ? profile.shortBreakMinutes * 60 : profile.longBreakMinutes * 60;
  const progress = ((totalDuration - secondsLeft) / totalDuration) * 100;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-text">
          <Timer className="text-primary" size={20} />
          <h2 className="font-semibold">Técnica Pomodoro</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase">
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>

      {activeTask && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-surface-hover border border-border text-xs text-text-muted truncate">
          Focando em: <span className="text-text font-medium">{activeTask.title}</span>
        </div>
      )}

      <div className="relative flex flex-col items-center justify-center py-6 min-h-50">
        <svg className="absolute -rotate-90" width={180} height={180} viewBox="0 0 36 36">
          <path
            className="text-border"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          />
          <path
            className="text-primary"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeDasharray={`${progress}, 100`}
            strokeLinecap="round"
            strokeWidth={2}
          />
        </svg>
        <div className="text-5xl font-bold font-mono text-text tabular-nums z-10">
          {minutes}:{seconds}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-2 z-10">
          <span className={cn('w-1.5 h-1.5 rounded-full', isRunning && 'pulse-glow bg-primary')} />
          Sessão {sessionsCompletedToday + 1} · {isRunning ? 'ativa' : 'pausada'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={start}
          disabled={isRunning}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim disabled:opacity-40 text-white font-medium text-sm transition-colors"
        >
          <Play size={15} /> Iniciar
        </button>
        <button
          onClick={pause}
          disabled={!isRunning}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-hover border border-border disabled:opacity-40 text-text font-medium text-sm transition-colors"
        >
          <Pause size={15} /> Pausar
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-hover border border-border text-text font-medium text-sm transition-colors"
        >
          <RotateCcw size={15} /> Reset
        </button>
      </div>
      <button onClick={skip} className="w-full text-xs text-text-muted hover:text-text mb-4 transition-colors">
        Pular para próxima fase →
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2">
          <Flame className="text-orange-400" size={18} />
          <div>
            <span className="text-[10px] uppercase text-text-muted block">Tempo Foco</span>
            <span className="text-sm font-semibold text-text">{focusMinutesToday} min</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2">
          <Coffee className="text-amber-400" size={18} />
          <div>
            <span className="text-[10px] uppercase text-text-muted block">Descanso</span>
            <span className="text-sm font-semibold text-text">{breakMinutesToday} min</span>
          </div>
        </div>
      </div>
    </div>
  );
}
