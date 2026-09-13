import { describe, it, expect } from 'vitest';
import { filterSortTasks, normalize, isFilterActive } from './taskQuery';
import type { TaskFilters } from './taskQuery';
import type { Task } from '../types';

const TODAY = '2026-09-13';

const base: TaskFilters = {
  query: '',
  categories: [],
  priorities: [],
  onlyFavorites: false,
  onlyOverdue: false,
  sort: 'priority',
  dir: 'desc',
};

function task(over: Partial<Task> & { id: string; title: string }): Task {
  return {
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

const tasks: Task[] = [
  task({ id: '1', title: 'Consulta de saúde', category: 'Saúde', priority: 'Baixa', dueDate: '2026-09-20' }),
  task({ id: '2', title: 'Revisar sprint', priority: 'Urgente', dueDate: '2026-09-10', isFavorite: true }),
  task({ id: '3', title: 'Comprar pão', category: 'Compras', priority: 'Alta' }),
  task({ id: '4', title: 'Tarefa antiga', status: 'completed', completedAt: '2026-09-12T18:00:00.000Z' }),
];

const ids = (list: Task[]) => list.map((t) => t.id);

describe('normalize', () => {
  it('ignora acentos e caixa', () => {
    expect(normalize('Saúde')).toBe('saude');
    expect(normalize('PÃO')).toBe('pao');
    expect(normalize('Revisão Trimestral')).toBe('revisao trimestral');
  });
});

describe('abas', () => {
  it('separa pendentes de concluídas', () => {
    expect(ids(filterSortTasks(tasks, base, 'pending', TODAY))).not.toContain('4');
    expect(ids(filterSortTasks(tasks, base, 'completed', TODAY))).toEqual(['4']);
  });
});

describe('busca', () => {
  it('encontra "Saúde" digitando "saude"', () => {
    expect(ids(filterSortTasks(tasks, { ...base, query: 'saude' }, 'pending', TODAY))).toEqual(['1']);
  });

  it('busca também na descrição', () => {
    const withDesc = [task({ id: '9', title: 'Reunião', description: 'Falar sobre orçamento' })];
    expect(ids(filterSortTasks(withDesc, { ...base, query: 'orcamento' }, 'pending', TODAY))).toEqual(['9']);
  });

  it('ignora espaços em volta do termo', () => {
    expect(ids(filterSortTasks(tasks, { ...base, query: '   pao  ' }, 'pending', TODAY))).toEqual(['3']);
  });
});

describe('filtros', () => {
  it('filtra por categoria', () => {
    expect(ids(filterSortTasks(tasks, { ...base, categories: ['Compras'] }, 'pending', TODAY))).toEqual(['3']);
  });

  it('filtra por prioridade', () => {
    expect(ids(filterSortTasks(tasks, { ...base, priorities: ['Urgente', 'Alta'] }, 'pending', TODAY))).toEqual(['2', '3']);
  });

  it('filtra favoritas', () => {
    expect(ids(filterSortTasks(tasks, { ...base, onlyFavorites: true }, 'pending', TODAY))).toEqual(['2']);
  });

  it('filtra atrasadas usando a data de referência', () => {
    // A tarefa 2 vence 10/09, antes de 13/09; a 1 vence depois; a 3 não tem prazo.
    expect(ids(filterSortTasks(tasks, { ...base, onlyOverdue: true }, 'pending', TODAY))).toEqual(['2']);
  });

  it('reconhece quando há filtros ativos', () => {
    expect(isFilterActive(base)).toBe(false);
    expect(isFilterActive({ ...base, query: 'x' })).toBe(true);
    expect(isFilterActive({ ...base, onlyOverdue: true })).toBe(true);
  });
});

describe('ordenação', () => {
  it('por prioridade, da mais urgente para a menos', () => {
    expect(ids(filterSortTasks(tasks, { ...base, sort: 'priority', dir: 'desc' }, 'pending', TODAY))).toEqual(['2', '3', '1']);
  });

  it('inverte a direção', () => {
    expect(ids(filterSortTasks(tasks, { ...base, sort: 'priority', dir: 'asc' }, 'pending', TODAY))).toEqual(['1', '3', '2']);
  });

  it('por prazo, mantendo tarefas sem data no fim em qualquer direção', () => {
    expect(ids(filterSortTasks(tasks, { ...base, sort: 'due', dir: 'asc' }, 'pending', TODAY))).toEqual(['2', '1', '3']);
    expect(ids(filterSortTasks(tasks, { ...base, sort: 'due', dir: 'desc' }, 'pending', TODAY))).toEqual(['1', '2', '3']);
  });

  it('alfabética ignorando acentos', () => {
    expect(ids(filterSortTasks(tasks, { ...base, sort: 'alpha', dir: 'asc' }, 'pending', TODAY))).toEqual(['3', '1', '2']);
  });

  it('não altera o array recebido', () => {
    const original = [...tasks];
    filterSortTasks(tasks, { ...base, sort: 'alpha' }, 'pending', TODAY);
    expect(tasks).toEqual(original);
  });
});
