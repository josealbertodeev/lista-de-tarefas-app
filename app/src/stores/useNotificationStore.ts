import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationStoreState {
  /** Ids of notifications the user has already seen. */
  readIds: string[];
  /** Ids already pushed to the OS, so each alert fires only once. */
  pushedIds: string[];
  /**
   * Ocorrências cujo lembrete já tocou (`compromissoId@data`).
   * Separado de pushedIds porque um lembrete é por ocorrência, e não por item do feed.
   */
  firedReminderIds: string[];
  markRead: (ids: string[]) => void;
  markPushed: (ids: string[]) => void;
  markReminderFired: (ids: string[]) => void;
  /** Descarta lembretes já disparados que ficaram velhos demais para importar. */
  pruneReminders: (keepIds: string[]) => void;
  /** Drops bookkeeping for notifications that no longer exist. */
  prune: (liveIds: string[]) => void;
}

const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set) => ({
      readIds: [],
      pushedIds: [],
      firedReminderIds: [],

      markRead: (ids) => set((s) => ({ readIds: union(s.readIds, ids) })),
      markPushed: (ids) => set((s) => ({ pushedIds: union(s.pushedIds, ids) })),
      markReminderFired: (ids) => set((s) => ({ firedReminderIds: union(s.firedReminderIds, ids) })),

      pruneReminders: (keepIds) =>
        set((s) => {
          const keep = new Set(keepIds);
          const firedReminderIds = s.firedReminderIds.filter((id) => keep.has(id));
          if (firedReminderIds.length === s.firedReminderIds.length) return s;
          return { firedReminderIds };
        }),

      prune: (liveIds) =>
        set((s) => {
          const live = new Set(liveIds);
          const readIds = s.readIds.filter((id) => live.has(id));
          const pushedIds = s.pushedIds.filter((id) => live.has(id));
          if (readIds.length === s.readIds.length && pushedIds.length === s.pushedIds.length) return s;
          return { readIds, pushedIds };
        }),
    }),
    {
      name: 'minhas-tarefas-notifications',
      version: 1,
      migrate: (persisted) => persisted as NotificationStoreState,
    }
  )
);
