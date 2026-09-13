import { useEffect } from 'react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { evaluateAchievements, toAchievement } from '../../lib/achievements';
import { useToday } from '../../lib/useToday';

/**
 * Avalia as conquistas num único lugar.
 *
 * Espalhar as verificações pelos componentes faria cada um lembrar de chamá-las;
 * aqui basta reagir às mudanças dos stores.
 */
export function AchievementEngine() {
  const tasks = useTaskStore((s) => s.tasks);
  const profile = useProfileStore((s) => s.profile);
  const achievements = useProfileStore((s) => s.achievements);
  const unlockAchievement = useProfileStore((s) => s.unlockAchievement);
  const addXp = useProfileStore((s) => s.addXp);
  const sessionsCompletedToday = usePomodoroStore((s) => s.sessionsCompletedToday);
  const today = useToday();

  useEffect(() => {
    const unlockedIds = new Set(achievements.map((a) => a.id));
    const fresh = evaluateAchievements({ tasks, profile, sessionsCompletedToday, today }, unlockedIds);
    if (fresh.length === 0) return;

    const now = new Date().toISOString();
    for (const def of fresh) {
      unlockAchievement(toAchievement(def, now));
      addXp(def.xp);
    }
  }, [tasks, profile, achievements, sessionsCompletedToday, today, unlockAchievement, addXp]);

  return null;
}
