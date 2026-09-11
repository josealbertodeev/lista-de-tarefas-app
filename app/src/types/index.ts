export type Category = 'Trabalho' | 'Pessoal' | 'Estudo' | 'Saúde' | 'Compras' | 'Outros';
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'completed';
export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ThemeMode = 'dark' | 'light';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  pomodoroEstimate: number;
  pomodorosCompleted: number;
  subtasks: Subtask[];
  isCriticalPath?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  location?: string;
  meetUrl?: string;
  category: Category;
  priority: Priority;
  reminder: string;
  repeat: Repeat;
  repeatEndDate?: string;
  participants: string[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: Category;
  deadline: string;
  targetMetric?: {
    current: number;
    target: number;
    unit: string;
  };
  progress: number; // 0 a 100
  createdAt: string;
}

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  dailyPomodoroTarget: number;
  dailyTaskTarget: number;
  level: number;
  xp: number;
  totalXp: number;
  streakDays: number;
  lastActiveDate?: string;
  theme: ThemeMode;
  soundEnabled: boolean;
  whiteNoiseEnabled: boolean;
  notificationsEnabled: boolean;
}

export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

export interface PomodoroState {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  sessionsCompletedToday: number;
  focusMinutesToday: number;
  breakMinutesToday: number;
  activeTaskId?: string;
  lastTickDate: string; // YYYY-MM-DD, used to reset daily counters
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  unlockedAt?: string;
}

export const CATEGORIES: Category[] = ['Trabalho', 'Pessoal', 'Estudo', 'Saúde', 'Compras', 'Outros'];
export const PRIORITIES: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

export const CATEGORY_ICONS: Record<Category, string> = {
  Trabalho: '💼',
  Pessoal: '🏠',
  Estudo: '📚',
  Saúde: '❤️',
  Compras: '🛒',
  Outros: '📌',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Trabalho: '#f59e0b',
  Pessoal: '#8b5cf6',
  Estudo: '#3b82f6',
  Saúde: '#f43f5e',
  Compras: '#06b6d4',
  Outros: '#64748b',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  Baixa: '#22c55e',
  Média: '#eab308',
  Alta: '#f97316',
  Urgente: '#ef4444',
};
