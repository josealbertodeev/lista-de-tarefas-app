import { create } from 'zustand';
import type { TaskTab } from '../lib/taskQuery';

interface TaskFilterState {
  tab: TaskTab;
  setTab: (tab: TaskTab) => void;
}

/**
 * Aba (pendentes/concluídas) da lista de tarefas.
 *
 * Fica num store, e não em useState, porque o App desmonta a view ao navegar:
 * com estado local, ir ao Kanban e voltar perdia a aba selecionada.
 */
export const useTaskFilterStore = create<TaskFilterState>()((set) => ({
  tab: 'pending',
  setTab: (tab) => set({ tab }),
}));
