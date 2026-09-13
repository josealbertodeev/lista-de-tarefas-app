import type { Achievement, Appointment, Category, Goal, Priority, Subtask, Task, TaskStatus, UserProfile } from '../types';
import { CATEGORIES, PRIORITIES } from '../types';
import { uid } from './utils';

/**
 * Leitura e escrita do arquivo de backup.
 *
 * A versão anterior aceitava qualquer JSON que tivesse uma chave `tasks` e
 * sobrescrevia tudo. Um arquivo truncado ou de outro app destruía os dados sem aviso,
 * e registros mal formados quebravam a aplicação depois (uma tarefa sem `subtasks`
 * faz `toggleSubtask` lançar exceção).
 *
 * Aqui cada registro é validado individualmente: os inválidos são descartados e
 * contados, em vez de abortar a importação inteira.
 */

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  tasks: Task[];
  appointments: Appointment[];
  goals: Goal[];
  profile?: Partial<UserProfile>;
  achievements: Achievement[];
  pomodoro?: {
    sessionsCompletedToday: number;
    focusMinutesToday: number;
    breakMinutesToday: number;
    lastTickDate: string;
  };
}

export interface EntitySummary {
  kept: number;
  skipped: number;
}

export interface BackupSummary {
  tasks: EntitySummary;
  appointments: EntitySummary;
  goals: EntitySummary;
  achievements: EntitySummary;
  hasProfile: boolean;
  exportedAt?: string;
  schemaVersion?: number;
}

export type ParseResult =
  | { ok: true; data: BackupPayload; summary: BackupSummary }
  | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'review', 'completed'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isoDate(value: unknown): string | undefined {
  const s = str(value);
  if (!s || !DATE_RE.test(s)) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return valid ? s : undefined;
}

function isoTime(value: unknown): string | undefined {
  const s = str(value);
  if (!s || !TIME_RE.test(s)) return undefined;
  const [h, min] = s.split(':').map(Number);
  return h <= 23 && min <= 59 ? s : undefined;
}

function num(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function category(value: unknown): Category {
  return CATEGORIES.includes(value as Category) ? (value as Category) : 'Outros';
}

function priority(value: unknown): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : 'Média';
}

function timestamp(value: unknown, fallback: string): string {
  const s = str(value);
  if (!s) return fallback;
  return Number.isNaN(new Date(s).getTime()) ? fallback : s;
}

function subtasks(value: unknown): Subtask[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isObject(raw)) return [];
    const title = str(raw.title);
    if (!title) return [];
    return [{ id: str(raw.id) ?? uid(), title, completed: raw.completed === true }];
  });
}

/** Título é o único campo realmente obrigatório; o resto ganha um padrão seguro. */
function sanitizeTask(raw: unknown): Task | null {
  if (!isObject(raw)) return null;
  const title = str(raw.title);
  if (!title) return null;
  const status = STATUSES.includes(raw.status as TaskStatus) ? (raw.status as TaskStatus) : 'backlog';
  return {
    id: str(raw.id) ?? uid(),
    title,
    description: str(raw.description),
    category: category(raw.category),
    priority: priority(raw.priority),
    status,
    dueDate: isoDate(raw.dueDate),
    dueTime: isoTime(raw.dueTime),
    pomodoroEstimate: num(raw.pomodoroEstimate, 1, 0, 99),
    pomodorosCompleted: num(raw.pomodorosCompleted, 0, 0, 999),
    subtasks: subtasks(raw.subtasks),
    isCriticalPath: raw.isCriticalPath === true,
    isFavorite: raw.isFavorite === true,
    // Tarefas concluídas voltam já marcadas: sem isto, importar um backup permitiria
    // ganhar o XP delas outra vez.
    xpAwarded: raw.xpAwarded === true || status === 'completed',
    createdAt: timestamp(raw.createdAt, new Date().toISOString()),
    completedAt: status === 'completed' ? timestamp(raw.completedAt, new Date().toISOString()) : undefined,
  };
}

function sanitizeAppointment(raw: unknown): Appointment | null {
  if (!isObject(raw)) return null;
  const title = str(raw.title);
  const date = isoDate(raw.date);
  const time = isoTime(raw.time);
  // Sem título, data ou horário o compromisso não tem como ser exibido no calendário.
  if (!title || !date || !time) return null;
  return {
    id: str(raw.id) ?? uid(),
    title,
    description: str(raw.description),
    date,
    time,
    durationMinutes: num(raw.durationMinutes, 30, 5, 1440),
    location: str(raw.location),
    meetUrl: str(raw.meetUrl),
    category: category(raw.category),
    priority: priority(raw.priority),
    reminder: str(raw.reminder) ?? 'none',
    repeat: (['none', 'daily', 'weekly', 'monthly', 'yearly'] as const).includes(raw.repeat as never)
      ? (raw.repeat as Appointment['repeat'])
      : 'none',
    repeatEndDate: isoDate(raw.repeatEndDate),
    participants: Array.isArray(raw.participants) ? raw.participants.flatMap((p) => str(p) ?? []) : [],
    exceptions: Array.isArray(raw.exceptions) ? raw.exceptions.flatMap((d) => isoDate(d) ?? []) : undefined,
  };
}

function sanitizeGoal(raw: unknown): Goal | null {
  if (!isObject(raw)) return null;
  const title = str(raw.title);
  const deadline = isoDate(raw.deadline);
  if (!title || !deadline) return null;

  const metric = isObject(raw.targetMetric) ? raw.targetMetric : undefined;
  const target = metric ? num(metric.target, 1, 1) : undefined;

  return {
    id: str(raw.id) ?? uid(),
    title,
    description: str(raw.description),
    category: category(raw.category),
    deadline,
    targetMetric:
      metric && target
        ? { current: num(metric.current, 0, 0, target), target, unit: str(metric.unit) ?? 'unidades' }
        : undefined,
    progress: num(raw.progress, 0, 0, 100),
    createdAt: timestamp(raw.createdAt, new Date().toISOString()),
  };
}

function sanitizeAchievement(raw: unknown): Achievement | null {
  if (!isObject(raw)) return null;
  const id = str(raw.id);
  const title = str(raw.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    description: str(raw.description) ?? '',
    xp: num(raw.xp, 0, 0, 100000),
    unlockedAt: str(raw.unlockedAt),
  };
}

/** Só campos conhecidos do perfil entram; o resto do JSON é descartado. */
function sanitizeProfile(raw: unknown): Partial<UserProfile> | undefined {
  if (!isObject(raw)) return undefined;
  const out: Partial<UserProfile> = {};
  if (typeof raw.name === 'string') out.name = raw.name;
  if (typeof raw.role === 'string') out.role = raw.role;
  if (typeof raw.avatarUrl === 'string') out.avatarUrl = raw.avatarUrl;
  out.focusMinutes = num(raw.focusMinutes, 25, 1, 180);
  out.shortBreakMinutes = num(raw.shortBreakMinutes, 5, 1, 60);
  out.longBreakMinutes = num(raw.longBreakMinutes, 15, 1, 120);
  out.dailyPomodoroTarget = num(raw.dailyPomodoroTarget, 8, 1, 50);
  out.dailyTaskTarget = num(raw.dailyTaskTarget, 5, 1, 100);
  out.level = num(raw.level, 1, 1, 999);
  out.xp = num(raw.xp, 0, 0);
  out.totalXp = num(raw.totalXp, 0, 0);
  out.streakDays = num(raw.streakDays, 0, 0);
  out.lastActiveDate = isoDate(raw.lastActiveDate);
  if (raw.theme === 'dark' || raw.theme === 'light') out.theme = raw.theme;
  if (typeof raw.soundEnabled === 'boolean') out.soundEnabled = raw.soundEnabled;
  if (typeof raw.notificationsEnabled === 'boolean') out.notificationsEnabled = raw.notificationsEnabled;
  return out;
}

export function buildBackup(input: Omit<BackupPayload, 'schemaVersion' | 'exportedAt'>): BackupPayload {
  return { schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString(), ...input };
}

export function serializeBackup(input: Omit<BackupPayload, 'schemaVersion' | 'exportedAt'>): string {
  return JSON.stringify(buildBackup(input), null, 2);
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido. Ele pode estar corrompido ou incompleto.' };
  }
  if (!isObject(raw)) {
    return { ok: false, error: 'O conteúdo do arquivo não tem o formato de um backup.' };
  }

  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const rawAppointments = Array.isArray(raw.appointments) ? raw.appointments : [];
  const rawGoals = Array.isArray(raw.goals) ? raw.goals : [];
  const rawAchievements = Array.isArray(raw.achievements) ? raw.achievements : [];

  if (!Array.isArray(raw.tasks) && !Array.isArray(raw.appointments) && !Array.isArray(raw.goals)) {
    return { ok: false, error: 'Nenhuma tarefa, compromisso ou meta foi encontrada neste arquivo.' };
  }

  const tasks = rawTasks.map(sanitizeTask).filter((t): t is Task => t !== null);
  const appointments = rawAppointments.map(sanitizeAppointment).filter((a): a is Appointment => a !== null);
  const goals = rawGoals.map(sanitizeGoal).filter((g): g is Goal => g !== null);
  const achievements = rawAchievements.map(sanitizeAchievement).filter((a): a is Achievement => a !== null);
  const profile = sanitizeProfile(raw.profile);

  const pomodoroRaw = isObject(raw.pomodoro) ? raw.pomodoro : undefined;

  return {
    ok: true,
    data: {
      schemaVersion: num(raw.schemaVersion, 0, 0),
      exportedAt: str(raw.exportedAt) ?? '',
      tasks,
      appointments,
      goals,
      achievements,
      profile,
      pomodoro: pomodoroRaw
        ? {
            sessionsCompletedToday: num(pomodoroRaw.sessionsCompletedToday, 0, 0),
            focusMinutesToday: num(pomodoroRaw.focusMinutesToday, 0, 0),
            breakMinutesToday: num(pomodoroRaw.breakMinutesToday, 0, 0),
            lastTickDate: isoDate(pomodoroRaw.lastTickDate) ?? '',
          }
        : undefined,
    },
    summary: {
      tasks: { kept: tasks.length, skipped: rawTasks.length - tasks.length },
      appointments: { kept: appointments.length, skipped: rawAppointments.length - appointments.length },
      goals: { kept: goals.length, skipped: rawGoals.length - goals.length },
      achievements: { kept: achievements.length, skipped: rawAchievements.length - achievements.length },
      hasProfile: !!profile,
      exportedAt: str(raw.exportedAt),
      schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : undefined,
    },
  };
}

/** Junta dois conjuntos mantendo os registros já existentes e ignorando ids repetidos. */
export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}
