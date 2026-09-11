import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, Appointment, Goal, Subtask } from '../types';
import { uid, todayISO } from '../lib/utils';
import { useProfileStore } from './useProfileStore';

interface TaskStoreState {
  tasks: Task[];
  appointments: Appointment[];
  goals: Goal[];
  lastCompletedTaskId: string | null;

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

  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'progress'> & { progress?: number }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

export const useTaskStore = create<TaskStoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      appointments: [],
      goals: [],
      lastCompletedTaskId: null,

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

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      moveTask: (id, status) => {
        const task = get().tasks.find((t) => t.id === id);
        const becameCompleted = !!task && task.status !== 'completed' && status === 'completed';
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status, completedAt: status === 'completed' ? new Date().toISOString() : t.completedAt }
              : t
          ),
          lastCompletedTaskId: becameCompleted ? id : s.lastCompletedTaskId,
        }));
        if (becameCompleted && task) {
          const xpAmount = { Baixa: 15, Média: 25, Alta: 40, Urgente: 60 }[task.priority];
          useProfileStore.getState().addXp(xpAmount);
          useProfileStore.getState().registerDailyActivity();
        }
      },

      toggleTaskCompletion: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const completed = task.status !== 'completed';
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: completed ? 'completed' : 'backlog', completedAt: completed ? new Date().toISOString() : undefined }
              : t
          ),
          lastCompletedTaskId: completed ? id : s.lastCompletedTaskId,
        }));
        if (completed) {
          const xpAmount = { Baixa: 15, Média: 25, Alta: 40, Urgente: 60 }[task.priority];
          useProfileStore.getState().addXp(xpAmount);
          useProfileStore.getState().registerDailyActivity();
        }
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

      clearCompletedTasks: () => set((s) => ({ tasks: s.tasks.filter((t) => t.status !== 'completed') })),
      clearAllTasks: () => set({ tasks: [] }),

      addAppointment: (appt) => set((s) => ({ appointments: [...s.appointments, { ...appt, id: uid() }] })),
      updateAppointment: (id, patch) =>
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAppointment: (id) => set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),

      addGoal: (goal) =>
        set((s) => ({
          goals: [...s.goals, { ...goal, id: uid(), createdAt: todayISO(), progress: goal.progress ?? 0 }],
        })),
      updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
    }),
    { name: 'minhas-tarefas-data' }
  )
);
