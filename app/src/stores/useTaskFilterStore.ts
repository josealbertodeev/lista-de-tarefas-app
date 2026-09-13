import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, Priority } from '../types';
import type { TaskFilters, TaskSort, TaskTab } from '../lib/taskQuery';

interface TaskFilterState extends TaskFilters {
  tab: TaskTab;
  setQuery: (query: string) => void;
  toggleCategory: (category: Category) => void;
  togglePriority: (priority: Priority) => void;
  toggleFavorites: () => void;
  toggleOverdue: () => void;
  setSort: (sort: TaskSort) => void;
  toggleDirection: () => void;
  setTab: (tab: TaskTab) => void;
  clearFilters: () => void;
}

const emptyFilters: TaskFilters = {
  query: '',
  categories: [],
  priorities: [],
  onlyFavorites: false,
  onlyOverdue: false,
  sort: 'priority',
  dir: 'desc',
};

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * Filtros da lista de tarefas.
 *
 * Ficam num store, e não em useState, porque o App desmonta a view ao navegar:
 * com estado local, ir ao Kanban e voltar perdia tudo o que estava filtrado.
 */
export const useTaskFilterStore = create<TaskFilterState>()(
  persist(
    (set) => ({
      ...emptyFilters,
      tab: 'pending',

      setQuery: (query) => set({ query }),
      toggleCategory: (category) => set((s) => ({ categories: toggleIn(s.categories, category) })),
      togglePriority: (priority) => set((s) => ({ priorities: toggleIn(s.priorities, priority) })),
      toggleFavorites: () => set((s) => ({ onlyFavorites: !s.onlyFavorites })),
      toggleOverdue: () => set((s) => ({ onlyOverdue: !s.onlyOverdue })),
      setSort: (sort) => set({ sort }),
      toggleDirection: () => set((s) => ({ dir: s.dir === 'desc' ? 'asc' : 'desc' })),
      setTab: (tab) => set({ tab }),
      clearFilters: () => set({ ...emptyFilters }),
    }),
    {
      name: 'minhas-tarefas-filters',
      version: 1,
      // Busca e aba não são persistidas de propósito: reabrir o app com um termo de
      // busca antigo esconde tarefas sem explicação. Já "só Trabalho, por prazo" é
      // exatamente o que se espera encontrar de volta.
      partialize: (s): Partial<TaskFilterState> => ({
        categories: s.categories,
        priorities: s.priorities,
        onlyFavorites: s.onlyFavorites,
        onlyOverdue: s.onlyOverdue,
        sort: s.sort,
        dir: s.dir,
      }),
    }
  )
);
