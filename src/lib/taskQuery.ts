import type { Category, Priority, Task } from '../types';
import { PRIORITIES } from '../types';

export type TaskSort = 'priority' | 'due' | 'created' | 'alpha';
export type SortDirection = 'asc' | 'desc';
export type TaskTab = 'pending' | 'completed';

export interface TaskFilters {
  query: string;
  categories: Category[];
  priorities: Priority[];
  onlyFavorites: boolean;
  onlyOverdue: boolean;
  sort: TaskSort;
  dir: SortDirection;
}

export const PRIORITY_ORDER: Record<string, number> = Object.fromEntries(PRIORITIES.map((p, i) => [p, i]));

export const SORT_LABELS: Record<TaskSort, string> = {
  priority: 'Prioridade',
  due: 'Prazo',
  created: 'Criação',
  alpha: 'Alfabética',
};

const DIACRITICS = /[\u0300-\u036f]/g;

/**
 * Remove acentos e caixa para a busca. Sem isto, procurar "saude" não encontraria
 * "Saúde" — inaceitável em português.
 */
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(DIACRITICS, '');
}

export function isFilterActive(filters: TaskFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.categories.length > 0 ||
    filters.priorities.length > 0 ||
    filters.onlyFavorites ||
    filters.onlyOverdue
  );
}

function matchesQuery(task: Task, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return (
    normalize(task.title).includes(normalizedQuery) ||
    (!!task.description && normalize(task.description).includes(normalizedQuery))
  );
}

/** Comparação sempre no sentido crescente; a direção escolhida é aplicada depois. */
function compareAsc(a: Task, b: Task, sort: TaskSort): number {
  switch (sort) {
    case 'priority':
      return (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
    case 'due':
      return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
    case 'created':
      return a.createdAt.localeCompare(b.createdAt);
    case 'alpha':
      return normalize(a.title).localeCompare(normalize(b.title));
  }
}

/**
 * Filtra e ordena as tarefas de uma aba. Pura: recebe `today` em vez de ler o relógio,
 * para poder ser testada e para acompanhar a virada do dia.
 */
export function filterSortTasks(tasks: Task[], filters: TaskFilters, tab: TaskTab, today: string): Task[] {
  const normalizedQuery = normalize(filters.query.trim());

  const filtered = tasks.filter((task) => {
    const isCompleted = task.status === 'completed';
    if (tab === 'completed' ? !isCompleted : isCompleted) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(task.category)) return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
    if (filters.onlyFavorites && !task.isFavorite) return false;
    if (filters.onlyOverdue && !(task.dueDate && task.dueDate < today)) return false;
    return matchesQuery(task, normalizedQuery);
  });

  // A aba de concluídas ignora a ordenação escolhida: ali o que importa é o que caiu por último.
  if (tab === 'completed') {
    return filtered.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  }

  // Ao ordenar por prazo, tarefas sem data ficam no fim nas duas direções —
  // inverter a lista as jogaria para o topo, que não é o que ninguém espera.
  const undated = filters.sort === 'due' ? filtered.filter((t) => !t.dueDate) : [];
  const sortable = filters.sort === 'due' ? filtered.filter((t) => t.dueDate) : filtered;

  const sorted = sortable.sort((a, b) => {
    const result = compareAsc(a, b, filters.sort);
    return filters.dir === 'asc' ? result : -result;
  });

  return [...sorted, ...undated];
}
