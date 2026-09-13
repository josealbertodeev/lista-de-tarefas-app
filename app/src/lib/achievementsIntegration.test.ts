import { describe, it, expect, beforeEach, vi } from 'vitest';

// Os stores usam persist(localStorage); em ambiente node ele não existe.
const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
});

const { useTaskStore } = await import('../stores/useTaskStore');
const { useProfileStore } = await import('../stores/useProfileStore');
const { evaluateAchievements } = await import('./achievements');
const { todayISO } = await import('./utils');

/**
 * Percorre o caminho real: store de tarefas -> estado -> avaliação das conquistas.
 * O componente AchievementEngine faz exatamente esta chamada dentro de um efeito.
 */
function evaluateNow(unlockedIds: string[] = []) {
  return evaluateAchievements(
    {
      tasks: useTaskStore.getState().tasks,
      profile: useProfileStore.getState().profile,
      sessionsCompletedToday: 0,
      today: todayISO(),
    },
    new Set(unlockedIds)
  ).map((a) => a.id);
}

beforeEach(() => {
  useTaskStore.setState({ tasks: [], appointments: [], goals: [], lastRemoved: null, lastCompletedTaskId: null });
  useProfileStore.setState((s) => ({
    profile: { ...s.profile, level: 1, xp: 0, totalXp: 0, streakDays: 0, lastActiveDate: undefined },
    achievements: [],
  }));
});

describe('conquistas no fluxo real do app', () => {
  it('nada é desbloqueado num app vazio — 0 de 10 é o estado correto', () => {
    expect(evaluateNow()).toEqual([]);
  });

  it('criar uma tarefa ainda não desbloqueia nada; concluir desbloqueia', () => {
    const task = useTaskStore.getState().addTask({
      title: 'Primeira tarefa',
      category: 'Trabalho',
      priority: 'Média',
      pomodoroEstimate: 1,
    });
    expect(evaluateNow()).toEqual([]);

    useTaskStore.getState().toggleTaskCompletion(task.id);
    expect(evaluateNow()).toContain('first-task');
  });

  it('reconhece progresso anterior: quem já tinha 10 concluídas desbloqueia ao abrir', () => {
    // As verificações olham o estado atual, não eventos — histórico conta.
    for (let i = 0; i < 10; i++) {
      const t = useTaskStore.getState().addTask({
        title: `Tarefa ${i}`,
        category: 'Trabalho',
        priority: 'Baixa',
        pomodoroEstimate: 1,
      });
      useTaskStore.getState().toggleTaskCompletion(t.id);
    }
    const ids = evaluateNow();
    expect(ids).toContain('first-task');
    expect(ids).toContain('ten-tasks');
  });

  it('concluir pelo quadro Kanban também conta', () => {
    const task = useTaskStore.getState().addTask({
      title: 'Via Kanban',
      category: 'Trabalho',
      priority: 'Alta',
      pomodoroEstimate: 1,
    });
    useTaskStore.getState().moveTask(task.id, 'completed');
    expect(evaluateNow()).toContain('first-task');
  });

  it('não repete um selo já desbloqueado', () => {
    const task = useTaskStore.getState().addTask({
      title: 'Tarefa',
      category: 'Trabalho',
      priority: 'Média',
      pomodoroEstimate: 1,
    });
    useTaskStore.getState().toggleTaskCompletion(task.id);
    expect(evaluateNow(['first-task'])).not.toContain('first-task');
  });

  it('desmarcar e remarcar não concede XP duas vezes', () => {
    const task = useTaskStore.getState().addTask({
      title: 'Tarefa',
      category: 'Trabalho',
      priority: 'Urgente',
      pomodoroEstimate: 1,
    });
    useTaskStore.getState().toggleTaskCompletion(task.id);
    const afterFirst = useProfileStore.getState().profile.totalXp;
    expect(afterFirst).toBeGreaterThan(0);

    useTaskStore.getState().toggleTaskCompletion(task.id); // desmarca
    useTaskStore.getState().toggleTaskCompletion(task.id); // marca de novo
    expect(useProfileStore.getState().profile.totalXp).toBe(afterFirst);
  });

  it('o selo "Dia Zerado" exige que as tarefas de hoje estejam todas concluídas', () => {
    const hoje = todayISO();
    const a = useTaskStore.getState().addTask({ title: 'A', category: 'Trabalho', priority: 'Média', dueDate: hoje, pomodoroEstimate: 1 });
    const b = useTaskStore.getState().addTask({ title: 'B', category: 'Trabalho', priority: 'Média', dueDate: hoje, pomodoroEstimate: 1 });

    useTaskStore.getState().toggleTaskCompletion(a.id);
    expect(evaluateNow()).not.toContain('clean-day');

    useTaskStore.getState().toggleTaskCompletion(b.id);
    expect(evaluateNow()).toContain('clean-day');
  });
});
