import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationStoreState {
  /** Ids of notifications the user has already seen. */
  readIds: string[];
  /** Ids already pushed to the OS, so each alert fires only once. */
  pushedIds: string[];
  markRead: (ids: string[]) => void;
  markPushed: (ids: string[]) => void;
  /** Drops bookkeeping for notifications that no longer exist. */
  prune: (liveIds: string[]) => void;
}

const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set) => ({
      readIds: [],
      pushedIds: [],

      markRead: (ids) => set((s) => ({ readIds: union(s.readIds, ids) })),
      markPushed: (ids) => set((s) => ({ pushedIds: union(s.pushedIds, ids) })),

      prune: (liveIds) =>
        set((s) => {
          const live = new Set(liveIds);
          const readIds = s.readIds.filter((id) => live.has(id));
          const pushedIds = s.pushedIds.filter((id) => live.has(id));
          if (readIds.length === s.readIds.length && pushedIds.length === s.pushedIds.length) return s;
          return { readIds, pushedIds };
        }),
    }),
    { name: 'minhas-tarefas-notifications' }
  )
);
