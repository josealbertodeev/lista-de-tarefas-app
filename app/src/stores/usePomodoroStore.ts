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
        set({ isRunning: true });
      },
      pause: () => set({ isRunning: false }),

      reset: () => set((s) => ({ isRunning: false, secondsLeft: phaseDurationSeconds(s.phase) })),

      skip: () => {
        const s = get();
        const nextPhase: PomodoroPhase =
          s.phase === 'focus' ? ((s.sessionsCompletedToday + 1) % 4 === 0 ? 'long_break' : 'short_break') : 'focus';
        set({ phase: nextPhase, secondsLeft: phaseDurationSeconds(nextPhase), isRunning: false });
      },

      setActiveTask: (taskId) => set({ activeTaskId: taskId }),

      tick: () => {
        get().ensureFreshDay();
        const s = get();
        if (!s.isRunning) return;
        if (s.secondsLeft > 1) {
          set({ secondsLeft: s.secondsLeft - 1 });
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
          set({ phase: 'focus', secondsLeft: phaseDurationSeconds('focus'), isRunning: false, breakMinutesToday });
        }
      },
    }),
    { name: 'minhas-tarefas-pomodoro', partialize: (s) => ({ ...s, isRunning: false }) }
  )
);
