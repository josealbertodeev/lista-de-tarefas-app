import { Award, Flame } from 'lucide-react';
import { useProfileStore, titleForLevel } from '../../stores/useProfileStore';
import { xpForLevel } from '../../lib/utils';

export function AchievementsCard() {
  const profile = useProfileStore((s) => s.profile);
  const need = xpForLevel(profile.level);
  const percent = Math.min(100, Math.round((profile.xp / need) * 100));

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-text">
          <Award className="text-primary" size={20} />
          <h2 className="font-semibold">Conquistas & Nível</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
          Nível {profile.level} · {titleForLevel(profile.level)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>Progresso para o Nível {profile.level + 1}</span>
          <span className="font-mono text-text">
            {profile.xp} / {need} XP
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-center gap-2">
          <Flame className="text-orange-400" size={18} />
          <div>
            <span className="text-[10px] uppercase text-text-muted block">Sequência</span>
            <span className="text-sm font-semibold text-text">{profile.streakDays} dias</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-surface-hover border border-border">
          <span className="text-[10px] uppercase text-text-muted block">XP Total</span>
          <span className="text-sm font-semibold text-text font-mono">{profile.totalXp.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}
