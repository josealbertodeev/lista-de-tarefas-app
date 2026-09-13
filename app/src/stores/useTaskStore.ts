import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, Appointment, Goal, Subtask, Priority } from '../types';
import { uid, todayISO } from '../lib/utils';
import { useProfileStore } from './useProfileStore';

/** Tarefas removidas por último, guardadas para o "Desfazer". */
export interface RemovedTasks {
  tasks: { task: Task; index: number }[];
  label: string;
  at: number;
}

interface TaskStoreState {
  tasks: Task[];
  appointments: Appointment[];
  goals: Goal[];
  lastCompletedTaskId: string | null;
  lastRemoved: RemovedTasks | null;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'pomodorosCompleted' | 'subtasks'> & { subtasks?: Subtask[] }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  toggleTaskCompletion: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  incrementPomodoro: (taskId: string) => void;
  clearCompletedTasks: () => void;
  clearAllTasks: () => void;
  /** Repõe as tarefas da última remoção, cada uma na posição em que estava. */
  undoRemove: () => void;
  dismissUndo: () => void;

  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  /** Cancela uma única data de uma série recorrente, preservando as demais. */
  skipOccurrence: (id: string, date: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'> & { progress?: number }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

const XP_BY_PRIORITY: Record<Priority, number> = { Baixa: 15, Média: 25, Alta: 40, Urgente: 60 };

/**
 * Concede XP uma única vez por tarefa.
 *
 * Antes, marcar e desmarcar a mesma tarefa dava XP a cada vez — dava para subir de
 * nível sem fazer nada. A marca fica na tarefa e não é limpa ao desmarcar.
 */
function awardCompletionXp(task: Task): boolean {
  if (task.xpAwarded) return false;
  useProfileStore.getState().addXp(XP_BY_PRIORITY[task.priority]);
  useProfileStore.getState().registerDailyActivity();
  return true;
}

export const useTaskStore = create<TaskStoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      appointments: [],
      goals: [],
      lastCompletedTaskId: null,
      lastRemoved: null,

      addTask: (input) => {
        const task: Task = {
          id: uid(),
          status: 'backlog',
          pomodorosCompleted: 0,
          subtasks: input.subtasks ?? [],
          createdAt: new Date().toISOString(),
          ...input,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      deleteTask: (id) =>
        set((s) => {
          const index = s.tasks.findIndex((t) => t.id === id);
          if (index === -1) return s;
          return {
            tasks: s.tasks.filter((t) => t.id !== id),
            lastRemoved: { tasks: [{ task: s.tasks[index], index }], label: 'Tarefa excluída', at: Date.now() },
          };
        }),

      moveTask: (id, status) => {
        const task = get().tasks.find((t) => t.id === id);
        const becameCompleted = !!task && task.status !== 'completed' && status === 'completed';
        const awarded = becameCompleted && task ? awardCompletionXp(task) : false;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === 'completed' ? new Date().toISOString() : t.completedAt,
                  xpAwarded: awarded ? true : t.xpAwarded,
                }
              : t
          ),
          lastCompletedTaskId: becameCompleted ? id : s.lastCompletedTaskId,
        }));
      },

      toggleTaskCompletion: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const completed = task.status !== 'completed';
        const awarded = completed ? awardCompletionXp(task) : false;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: completed ? 'completed' : 'backlog',
                  completedAt: completed ? new Date().toISOString() : undefined,
                  xpAwarded: awarded ? true : t.xpAwarded,
                }
              : t
          ),
          lastCompletedTaskId: completed ? id : s.lastCompletedTaskId,
        }));
      },

      toggleFavorite: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t)) })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)),
                }
              : t
          ),
        })),

      addSubtask: (taskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: [...t.subtasks, { id: uid(), title, completed: false }] } : t
          ),
        })),

      incrementPomodoro: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, pomodorosCompleted: t.pomodorosCompleted + 1 } : t)),
        })),

      clearCompletedTasks: () =>
        set((s) => {
          const removed = s.tasks
            .map((task, index) => ({ task, index }))
            .filter(({ task }) => task.status === 'completed');
          if (removed.length === 0) return s;
          return {
            tasks: s.tasks.filter((t) => t.status !== 'completed'),
            lastRemoved: {
              tasks: removed,
              label: removed.length === 1 ? '1 tarefa concluída removida' : `${removed.length} tarefas concluídas removidas`,
              at: Date.now(),
            },
          };
        }),

      // "Apagar todos os dados" é deliberadamente definitivo: não alimenta o desfazer.
      clearAllTasks: () => set({ tasks: [], lastRemoved: null, lastCompletedTaskId: null }),

      undoRemove: () =>
        set((s) => {
          if (!s.lastRemoved) return s;
          const restored = [...s.tasks];
          // Reinsere em ordem crescente de índice para cada uma cair na posição original.
          for (const { task, index } of [...s.lastRemoved.tasks].sort((a, b) => a.index - b.index)) {
            restored.splice(Math.min(index, restored.length), 0, task);
          }
          return { tasks: restored, lastRemoved: null };
        }),

      dismissUndo: () => set({ lastRemoved: null }),

      addAppointment: (appt) => set((s) => ({ appointments: [...s.appointments, { ...appt, id: uid() }] })),
      updateAppointment: (id, patch) =>
        set((s) => ({
          appointments: s.appointments.map((a) => {
            if (a.id !== id) return a;
            const seriesChanged =
              (patch.date !== undefined && patch.date !== a.date) ||
              (patch.repeat !== undefined && patch.repeat !== a.repeat);
            const updated = { ...a, ...patch };
            return seriesChanged ? { ...updated, exceptions: [] } : updated;
          }),
        })),
      deleteAppointment: (id) => set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),

      skipOccurrence: (id, date) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id && !(a.exceptions ?? []).includes(date)
              ? { ...a, exceptions: [...(a.exceptions ?? []), date] }
              : a
          ),
        })),

      addGoal: (goal) =>
        set((s) => ({
          goals: [...s.goals, { ...goal, id: uid(), createdAt: todayISO(), progress: goal.progress ?? 0 }],
        })),
      updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
    }),
    {
      name: 'minhas-tarefas-data',
      version: 1,
      // Ponto de pouso para mudanças de formato: sem isto, acrescentar um campo a
      // Task/Appointment/Goal faria os dados já salvos serem reidratados com o formato antigo.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<TaskStoreState>;
        if (!Array.isArray(state.tasks)) return state as TaskStoreState;
        return {
          ...state,
          tasks: state.tasks.map((t) => ({ ...t, xpAwarded: t.xpAwarded ?? t.status === 'completed' })),
        } as TaskStoreState;
      },
    }
  )
);
