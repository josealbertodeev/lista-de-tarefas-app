import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PomodoroPhase } from '../types';
import { todayISO } from '../lib/utils';
import { useProfileStore } from './useProfileStore';
import { useTaskStore } from './useTaskStore';
import { playPhaseCompleteSound, notify } from '../lib/audio';

interface PomodoroStoreState {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  /**
   * Instante (epoch ms) em que a fase atual termina, gravado ao dar start.
   * Invariante: rodando => endsAt é a verdade; pausado => secondsLeft é a verdade.
   * Sem esta âncora o cronômetro perdia tempo com a aba em segundo plano, porque
   * o navegador estrangula setInterval, e congelava ao recarregar a página.
   */
  endsAt?: number;
  sessionsCompletedToday: number;
  focusMinutesToday: number;
  breakMinutesToday: number;
  activeTaskId?: string;
  lastTickDate: string;

  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  setActiveTask: (taskId?: string) => void;
  ensureFreshDay: () => void;
  /** Recalcula o tempo restante a partir da âncora — chamado ao voltar para a aba. */
  syncFromClock: () => void;
}

/** Segundos que faltam até um instante futuro, nunca negativo. */
function remainingSeconds(endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function phaseDurationSeconds(phase: PomodoroPhase): number {
  const { focusMinutes, shortBreakMinutes, longBreakMinutes } = useProfileStore.getState().profile;
  if (phase === 'focus') return focusMinutes * 60;
  if (phase === 'short_break') return shortBreakMinutes * 60;
  return longBreakMinutes * 60;
}

export const usePomodoroStore = create<PomodoroStoreState>()(
  persist(
    (set, get) => ({
      phase: 'focus',
      secondsLeft: phaseDurationSeconds('focus'),
      isRunning: false,
      endsAt: undefined,
      sessionsCompletedToday: 0,
      focusMinutesToday: 0,
      breakMinutesToday: 0,
      activeTaskId: undefined,
      lastTickDate: todayISO(),

      ensureFreshDay: () => {
        const today = todayISO();
        if (get().lastTickDate !== today) {
          set({ sessionsCompletedToday: 0, focusMinutesToday: 0, breakMinutesToday: 0, lastTickDate: today });
        }
      },

      start: () => {
        get().ensureFreshDay();
        const { secondsLeft } = get();
        set({ isRunning: true, endsAt: Date.now() + secondsLeft * 1000 });
      },

      pause: () =>
        set((s) => ({
          isRunning: false,
          secondsLeft: s.endsAt ? remainingSeconds(s.endsAt) : s.secondsLeft,
          endsAt: undefined,
        })),

      reset: () => set((s) => ({ isRunning: false, endsAt: undefined, secondsLeft: phaseDurationSeconds(s.phase) })),

      skip: () => {
        const s = get();
        const nextPhase: PomodoroPhase =
          s.phase === 'focus' ? ((s.sessionsCompletedToday + 1) % 4 === 0 ? 'long_break' : 'short_break') : 'focus';
        set({ phase: nextPhase, secondsLeft: phaseDurationSeconds(nextPhase), isRunning: false, endsAt: undefined });
      },

      setActiveTask: (taskId) => set({ activeTaskId: taskId }),

      syncFromClock: () => get().tick(),

      tick: () => {
        get().ensureFreshDay();
        const s = get();
        if (!s.isRunning) return;

        // O tempo restante vem do relógio, não da contagem de ticks: uma aba em segundo
        // plano pode receber muito menos de um tick por segundo.
        const remaining = s.endsAt ? remainingSeconds(s.endsAt) : s.secondsLeft;
        if (remaining > 0) {
          if (remaining !== s.secondsLeft) set({ secondsLeft: remaining });
          return;
        }
        // phase complete
        playPhaseCompleteSound();
        if (s.phase === 'focus') {
          const sessionsCompletedToday = s.sessionsCompletedToday + 1;
          const focusMinutesToday = s.focusMinutesToday + useProfileStore.getState().profile.focusMinutes;
          if (s.activeTaskId) useTaskStore.getState().incrementPomodoro(s.activeTaskId);
          useProfileStore.getState().addXp(20);
          const nextPhase: PomodoroPhase = sessionsCompletedToday % 4 === 0 ? 'long_break' : 'short_break';
          notify('Foco concluído! 🍅', 'Hora de uma pausa merecida.');
          set({
            phase: nextPhase,
            secondsLeft: phaseDurationSeconds(nextPhase),
            isRunning: false,
            endsAt: undefined,
            sessionsCompletedToday,
            focusMinutesToday,
          });
        } else {
          const breakMinutesToday =
            s.breakMinutesToday +
            (s.phase === 'short_break'
              ? useProfileStore.getState().profile.shortBreakMinutes
              : useProfileStore.getState().profile.longBreakMinutes);
          notify('Pausa concluída! ⚡', 'Vamos voltar ao foco.');
          set({ phase: 'focus', secondsLeft: phaseDurationSeconds('focus'), isRunning: false, endsAt: undefined, breakMinutesToday });
        }
      },
    }),
    {
      name: 'minhas-tarefas-pomodoro',
      version: 1,
      migrate: (persisted) => persisted as PomodoroStoreState,
      // isRunning não é persistido de propósito: retomar sozinho após um reload surpreende.
      // endsAt é, para que o tempo exibido seja o real e não um número congelado.
      partialize: (s) => ({ ...s, isRunning: false }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.ensureFreshDay();
        // Se a fase terminou com o app fechado, mostra a próxima fase pronta para começar
        // em vez de um contador parado no meio. Não encadeia várias fases.
        if (state.endsAt && Date.now() >= state.endsAt) {
          usePomodoroStore.setState({
            secondsLeft: phaseDurationSeconds(state.phase),
            endsAt: undefined,
            isRunning: false,
          });
        } else if (state.endsAt) {
          usePomodoroStore.setState({ secondsLeft: remainingSeconds(state.endsAt), isRunning: false, endsAt: undefined });
        }
      },
    }
  )
);
