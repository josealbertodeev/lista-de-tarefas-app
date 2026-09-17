import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, evaluateAchievements, achievementPercent } from './achievements';
import type { AchievementContext } from './achievements';
import type { Task, UserProfile } from '../types';

const TODAY = '2026-09-13';

function task(over: Partial<Task> & { id: string }): Task {
  return {
    title: 'Tarefa',
    category: 'Trabalho',
    priority: 'Média',
    status: 'backlog',
    pomodoroEstimate: 1,
    pomodorosCompleted: 0,
    subtasks: [],
    createdAt: '2026-09-01T10:00:00.000Z',
    ...over,
  } as Task;
}

const profile = { streakDays: 0 } as UserProfile;

function ctx(over: Partial<AchievementContext> = {}): AchievementContext {
  return { tasks: [], profile, sessionsCompletedToday: 0, today: TODAY, ...over };
}

const done = (id: string, over: Partial<Task> = {}) =>
  task({ id, status: 'completed', completedAt: '2026-09-13T14:00:00.000Z', ...over });

const idsFrom = (list: { id: string }[]) => list.map((a) => a.id);

describe('catálogo', () => {
  it('não tem ids repetidos', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('não desbloqueia nada num perfil vazio', () => {
    expect(evaluateAchievements(ctx(), new Set())).toEqual([]);
  });
});

describe('conquistas por volume', () => {
  it('a primeira tarefa desbloqueia o primeiro selo', () => {
    expect(idsFrom(evaluateAchievements(ctx({ tasks: [done('1')] }), new Set()))).toContain('first-task');
  });

  it('dez tarefas desbloqueiam os dois primeiros', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => done(String(i)));
    const ids = idsFrom(evaluateAchievements(ctx({ tasks }), new Set()));
    expect(ids).toContain('first-task');
    expect(ids).toContain('ten-tasks');
    expect(ids).not.toContain('fifty-tasks');
  });

  it('não devolve o que já está desbloqueado', () => {
    const ids = idsFrom(evaluateAchievements(ctx({ tasks: [done('1')] }), new Set(['first-task'])));
    expect(ids).not.toContain('first-task');
  });
});

describe('conquistas por comportamento', () => {
  it('sequência de 7 dias', () => {
    const ids = idsFrom(evaluateAchievements(ctx({ profile: { streakDays: 7 } as UserProfile }), new Set()));
    expect(ids).toContain('streak-7');
    expect(ids).not.toContain('streak-30');
  });

  it('dez pomodoros num dia', () => {
    expect(idsFrom(evaluateAchievements(ctx({ sessionsCompletedToday: 10 }), new Set()))).toContain('pomodoro-10');
  });

  it('urgente no prazo exige conclusão até a data de vencimento', () => {
    const noPrazo = done('u', { priority: 'Urgente', dueDate: '2026-09-14' });
    const atrasada = done('a', { priority: 'Urgente', dueDate: '2026-09-10' });
    expect(idsFrom(evaluateAchievements(ctx({ tasks: [noPrazo] }), new Set()))).toContain('urgent-on-time');
    expect(idsFrom(evaluateAchievements(ctx({ tasks: [atrasada] }), new Set()))).not.toContain('urgent-on-time');
  });

  it('dia zerado exige ter tarefas do dia e todas concluídas', () => {
    const todasFeitas = [done('1', { dueDate: TODAY })];
    const umaPendente = [done('1', { dueDate: TODAY }), task({ id: '2', dueDate: TODAY })];
    expect(idsFrom(evaluateAchievements(ctx({ tasks: todasFeitas }), new Set()))).toContain('clean-day');
    expect(idsFrom(evaluateAchievements(ctx({ tasks: umaPendente }), new Set()))).not.toContain('clean-day');
    // Sem nenhuma tarefa para hoje, não conta como dia zerado.
    expect(idsFrom(evaluateAchievements(ctx({ tasks: [done('1')] }), new Set()))).not.toContain('clean-day');
  });

  it('madrugador olha a hora local da conclusão', () => {
    const cedo = done('m', { completedAt: new Date(2026, 8, 13, 6, 30).toISOString() });
    const tarde = done('t', { completedAt: new Date(2026, 8, 13, 10, 0).toISOString() });
    expect(idsFrom(evaluateAchievements(ctx({ tasks: [cedo] }), new Set()))).toContain('early-bird');
    expect(idsFrom(evaluateAchievements(ctx({ tasks: [tarde] }), new Set()))).not.toContain('early-bird');
  });
});

describe('progresso mostrado na interface', () => {
  it('conta quanto falta para os selos contáveis', () => {
    const tasks = Array.from({ length: 7 }, (_, i) => done(String(i)));
    const dez = ACHIEVEMENTS.find((a) => a.id === 'ten-tasks')!;
    expect(dez.progress!(ctx({ tasks }))).toEqual({ current: 7, target: 10 });
    expect(achievementPercent(dez, ctx({ tasks }), false)).toBeCloseTo(0.7);
  });

  it('nunca passa de 100%', () => {
    const tasks = Array.from({ length: 25 }, (_, i) => done(String(i)));
    const dez = ACHIEVEMENTS.find((a) => a.id === 'ten-tasks')!;
    expect(achievementPercent(dez, ctx({ tasks }), false)).toBe(1);
  });

  it('selo já conquistado vale 100% mesmo se a condição não valer mais', () => {
    // "Foco Total" depende dos pomodoros de hoje: amanhã o contador zera, mas o
    // selo conquistado não pode voltar a parecer incompleto.
    const foco = ACHIEVEMENTS.find((a) => a.id === 'pomodoro-10')!;
    expect(achievementPercent(foco, ctx({ sessionsCompletedToday: 0 }), true)).toBe(1);
  });

  it('selos não contáveis não expõem progresso parcial', () => {
    const madrugador = ACHIEVEMENTS.find((a) => a.id === 'early-bird')!;
    expect(madrugador.progress).toBeUndefined();
    expect(achievementPercent(madrugador, ctx(), false)).toBe(0);
  });

  it('todo selo contável tem alvo positivo', () => {
    for (const def of ACHIEVEMENTS) {
      if (!def.progress) continue;
      expect(def.progress(ctx()).target).toBeGreaterThan(0);
    }
  });
});
