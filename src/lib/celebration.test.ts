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
const { todayISO } = await import('./utils');

const tick = () => useTaskStore.getState().celebrationTick;

beforeEach(() => {
  useTaskStore.setState({ tasks: [], appointments: [], goals: [], lastRemoved: null, celebrationTick: 0 });
});

function criarMeta(progress: number) {
  useTaskStore.getState().addGoal({ title: 'Ler 10 livros', category: 'Pessoal', deadline: todayISO(), progress });
  return useTaskStore.getState().goals[0].id;
}

describe('sinal de comemoração (confete)', () => {
  it('sobe ao concluir uma tarefa', () => {
    const task = useTaskStore.getState().addTask({ title: 'Escrever relatório', priority: 'Média', category: 'Trabalho', pomodoroEstimate: 1 });
    useTaskStore.getState().toggleTaskCompletion(task.id);
    expect(tick()).toBe(1);
  });

  it('não sobe ao desmarcar, e volta a subir ao concluir a mesma tarefa de novo', () => {
    const task = useTaskStore.getState().addTask({ title: 'Escrever relatório', priority: 'Média', category: 'Trabalho', pomodoroEstimate: 1 });
    const { toggleTaskCompletion } = useTaskStore.getState();
    toggleTaskCompletion(task.id);
    toggleTaskCompletion(task.id); // desmarcou
    expect(tick()).toBe(1);
    toggleTaskCompletion(task.id);
    expect(tick()).toBe(2);
  });

  it('sobe quando uma meta chega a 100%', () => {
    const id = criarMeta(40);
    useTaskStore.getState().updateGoal(id, { progress: 100 });
    expect(tick()).toBe(1);
  });

  it('não sobe em progresso parcial nem ao editar uma meta já concluída', () => {
    const id = criarMeta(40);
    useTaskStore.getState().updateGoal(id, { progress: 80 });
    expect(tick()).toBe(0);
    useTaskStore.getState().updateGoal(id, { progress: 100 });
    useTaskStore.getState().updateGoal(id, { title: 'Ler 12 livros' });
    expect(tick()).toBe(1);
  });

});
