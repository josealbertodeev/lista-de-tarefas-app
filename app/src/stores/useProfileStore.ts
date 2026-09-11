import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, ThemeMode, Achievement } from '../types';
import { todayISO, xpForLevel, clamp } from '../lib/utils';

interface XpGainResult {
  leveledUp: boolean;
  newLevel: number;
  achievement?: Achievement;
}

interface ProfileStoreState {
  profile: UserProfile;
  achievements: Achievement[];
  lastXpGain: number;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  addXp: (amount: number) => XpGainResult;
  registerDailyActivity: () => void;
  unlockAchievement: (achievement: Achievement) => void;
}

const defaultProfile: UserProfile = {
  name: '',
  role: '',
  avatarUrl: '',
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  dailyPomodoroTarget: 8,
  dailyTaskTarget: 5,
  level: 1,
  xp: 0,
  totalXp: 0,
  streakDays: 0,
  lastActiveDate: undefined,
  theme: 'dark',
  soundEnabled: true,
  notificationsEnabled: true,
};

const TITLES = ['Novato', 'Iniciante', 'Focado', 'Disciplinado', 'Estrategista', 'Mestre da Produtividade'];
export function titleForLevel(level: number): string {
  return TITLES[clamp(level - 1, 0, TITLES.length - 1)];
}

function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const useProfileStore = create<ProfileStoreState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      achievements: [],
      lastXpGain: 0,

      setTheme: (theme) => {
        applyThemeClass(theme);
        set((s) => ({ profile: { ...s.profile, theme } }));
      },

      toggleTheme: () => {
        const next: ThemeMode = get().profile.theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      addXp: (amount) => {
        let leveledUp = false;
        let newLevel = get().profile.level;
        set((s) => {
          let { level, xp, totalXp } = s.profile;
          xp += amount;
          totalXp += amount;
          let need = xpForLevel(level);
          while (xp >= need) {
            xp -= need;
            level += 1;
            leveledUp = true;
            need = xpForLevel(level);
          }
          newLevel = level;
          return { profile: { ...s.profile, level, xp, totalXp }, lastXpGain: amount };
        });
        return { leveledUp, newLevel };
      },

      registerDailyActivity: () => {
        const today = todayISO();
        set((s) => {
          if (s.profile.lastActiveDate === today) return s;
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const streakDays = s.profile.lastActiveDate === yesterday ? s.profile.streakDays + 1 : 1;
          return { profile: { ...s.profile, lastActiveDate: today, streakDays } };
        });
      },

      unlockAchievement: (achievement) =>
        set((s) => ({ achievements: [...s.achievements, achievement] })),
    }),
    {
      name: 'minhas-tarefas-profile',
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeClass(state.profile.theme);
      },
    }
  )
);
