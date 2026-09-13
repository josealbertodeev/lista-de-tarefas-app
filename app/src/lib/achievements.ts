import type { Achievement, Task, UserProfile } from '../types';
import { isoFromTimestamp } from './utils';

/**
 * Catálogo de conquistas.
 *
 * O tipo `Achievement`, o array no perfil e `unlockAchievement` já existiam, mas
 * nada nunca chamava a função e não havia catálogo algum: o card "Conquistas e
 * Gamificação" mostrava só nível e XP, e a lista ficava permanentemente vazia.
 *
 * Título e descrição são lidos daqui na hora de exibir; o perfil guarda apenas o
 * que foi desbloqueado e quando, para que renomear um selo não exija migração.
 */

export interface AchievementContext {
  tasks: Task[];
  profile: UserProfile;
  sessionsCompletedToday: number;
  today: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  check: (ctx: AchievementContext) => boolean;
  /** Quanto já foi feito, quando o critério é contável. Usado na barra de progresso. */
  progress?: (ctx: AchievementContext) => { current: number; target: number };
}

/** Progresso de 0 a 1 — conquistas não contáveis valem 0 ou 1. */
export function achievementPercent(def: AchievementDef, ctx: AchievementContext, unlocked: boolean): number {
  if (unlocked || def.check(ctx)) return 1;
  if (!def.progress) return 0;
  const { current, target } = def.progress(ctx);
  return target <= 0 ? 0 : Math.min(1, current / target);
}

const completed = (tasks: Task[]) => tasks.filter((t) => t.status === 'completed');

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-task',
    title: 'Primeiro Passo',
    description: 'Conclua sua primeira tarefa',
    icon: '🌱',
    xp: 20,
    check: ({ tasks }) => completed(tasks).length >= 1,
    progress: ({ tasks }) => ({ current: completed(tasks).length, target: 1 }),
  },
  {
    id: 'ten-tasks',
    title: 'Pegando Ritmo',
    description: 'Conclua 10 tarefas',
    icon: '⚡',
    xp: 50,
    check: ({ tasks }) => completed(tasks).length >= 10,
    progress: ({ tasks }) => ({ current: completed(tasks).length, target: 10 }),
  },
  {
    id: 'fifty-tasks',
    title: 'Produtividade em Série',
    description: 'Conclua 50 tarefas',
    icon: '🚀',
    xp: 150,
    check: ({ tasks }) => completed(tasks).length >= 50,
    progress: ({ tasks }) => ({ current: completed(tasks).length, target: 50 }),
  },
  {
    id: 'hundred-tasks',
    title: 'Centurião',
    description: 'Conclua 100 tarefas',
    icon: '🏆',
    xp: 300,
    check: ({ tasks }) => completed(tasks).length >= 100,
    progress: ({ tasks }) => ({ current: completed(tasks).length, target: 100 }),
  },
  {
    id: 'streak-7',
    title: 'Semana Impecável',
    description: 'Mantenha 7 dias seguidos de atividade',
    icon: '🔥',
    xp: 100,
    check: ({ profile }) => profile.streakDays >= 7,
    progress: ({ profile }) => ({ current: profile.streakDays, target: 7 }),
  },
  {
    id: 'streak-30',
    title: 'Hábito Formado',
    description: 'Mantenha 30 dias seguidos de atividade',
    icon: '💎',
    xp: 400,
    check: ({ profile }) => profile.streakDays >= 30,
    progress: ({ profile }) => ({ current: profile.streakDays, target: 30 }),
  },
  {
    id: 'pomodoro-10',
    title: 'Foco Total',
    description: 'Complete 10 pomodoros em um único dia',
    icon: '🍅',
    xp: 120,
    check: ({ sessionsCompletedToday }) => sessionsCompletedToday >= 10,
    progress: ({ sessionsCompletedToday }) => ({ current: sessionsCompletedToday, target: 10 }),
  },
  {
    id: 'urgent-on-time',
    title: 'Sob Pressão',
    description: 'Conclua uma tarefa Urgente dentro do prazo',
    icon: '🎯',
    xp: 80,
    check: ({ tasks }) =>
      completed(tasks).some(
        (t) => t.priority === 'Urgente' && !!t.dueDate && !!t.completedAt && isoFromTimestamp(t.completedAt) <= t.dueDate
      ),
  },
  {
    id: 'clean-day',
    title: 'Dia Zerado',
    description: 'Conclua todas as tarefas que vencem hoje',
    icon: '✨',
    xp: 90,
    check: ({ tasks, today }) => {
      const dueToday = tasks.filter((t) => t.dueDate === today);
      return dueToday.length > 0 && dueToday.every((t) => t.status === 'completed');
    },
  },
  {
    id: 'early-bird',
    title: 'Madrugador',
    description: 'Conclua uma tarefa antes das 8h',
    icon: '🌅',
    xp: 60,
    check: ({ tasks }) =>
      completed(tasks).some((t) => !!t.completedAt && new Date(t.completedAt).getHours() < 8),
  },
];

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Conquistas que passaram a valer agora e ainda não estavam desbloqueadas. */
export function evaluateAchievements(ctx: AchievementContext, unlockedIds: Set<string>): AchievementDef[] {
  return ACHIEVEMENTS.filter((def) => !unlockedIds.has(def.id) && def.check(ctx));
}

export function toAchievement(def: AchievementDef, unlockedAt: string): Achievement {
  return { id: def.id, title: def.title, description: def.description, xp: def.xp, unlockedAt };
}
