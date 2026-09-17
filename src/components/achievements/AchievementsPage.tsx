import { useMemo } from 'react';
import { Award, Flame, Zap, Check, Lock, Sparkles } from 'lucide-react';
import { useProfileStore, titleForLevel } from '../../stores/useProfileStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { xpForLevel, cn, formatDateBR, isoFromTimestamp } from '../../lib/utils';
import { useToday } from '../../lib/useToday';
import { ACHIEVEMENTS, achievementPercent } from '../../lib/achievements';
import type { AchievementContext, AchievementDef } from '../../lib/achievements';
import type { Achievement } from '../../types';

/** Selos de menos XP viram bronze, os de mais XP viram diamante — dá pra ver de longe qual vale mais. */
interface Tier {
  label: string;
  ring: string;
  glow: string;
  badge: string;
  chip: string;
}

const TIERS: Tier[] = [
  { label: 'Bronze', ring: 'ring-amber-600/40', glow: 'from-amber-700 to-amber-500', badge: 'shadow-amber-600/30', chip: 'bg-amber-600/15 text-amber-500 border-amber-600/30' },
  { label: 'Prata', ring: 'ring-slate-300/40', glow: 'from-slate-400 to-slate-200', badge: 'shadow-slate-300/30', chip: 'bg-slate-400/15 text-slate-300 border-slate-400/30' },
  { label: 'Ouro', ring: 'ring-yellow-400/50', glow: 'from-yellow-500 to-amber-300', badge: 'shadow-yellow-400/40', chip: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' },
  { label: 'Platina', ring: 'ring-cyan-300/50', glow: 'from-cyan-400 to-blue-400', badge: 'shadow-cyan-300/40', chip: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30' },
];

function tierFor(xp: number): Tier {
  if (xp <= 50) return TIERS[0];
  if (xp <= 100) return TIERS[1];
  if (xp <= 200) return TIERS[2];
  return TIERS[3];
}

export function AchievementsPage() {
  const profile = useProfileStore((s) => s.profile);
  const unlocked = useProfileStore((s) => s.achievements);
  const tasks = useTaskStore((s) => s.tasks);
  const sessionsCompletedToday = usePomodoroStore((s) => s.sessionsCompletedToday);
  const today = useToday();

  const need = xpForLevel(profile.level);
  const percent = Math.min(100, Math.round((profile.xp / need) * 100));

  const ctx: AchievementContext = useMemo(
    () => ({ tasks, profile, sessionsCompletedToday, today }),
    [tasks, profile, sessionsCompletedToday, today]
  );

  const unlockedMap = useMemo(() => new Map(unlocked.map((a) => [a.id, a])), [unlocked]);

  // Desbloqueados primeiro; depois os mais próximos de sair, que são os que
  // realmente respondem "o que dá para conquistar agora".
  const ordered = useMemo(() => {
    return [...ACHIEVEMENTS]
      .map((def) => ({ def, earned: unlockedMap.get(def.id), percent: achievementPercent(def, ctx, unlockedMap.has(def.id)) }))
      .sort((a, b) => {
        if (!!a.earned !== !!b.earned) return a.earned ? -1 : 1;
        return b.percent - a.percent;
      });
  }, [ctx, unlockedMap]);

  const nextUp = ordered.find((a) => !a.earned && a.percent < 1);

  const kpis = [
    { label: 'Nível', value: `${profile.level} · ${titleForLevel(profile.level)}`, icon: Award, color: 'text-primary' },
    { label: 'Sequência', value: `${profile.streakDays} dias`, icon: Flame, color: 'text-orange-400' },
    { label: 'XP Total', value: profile.totalXp.toLocaleString('pt-BR'), icon: Zap, color: 'text-yellow-400' },
    { label: 'Selos Conquistados', value: `${unlockedMap.size} de ${ACHIEVEMENTS.length}`, icon: Check, color: 'text-emerald-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-text mb-1">Conquistas & Nível</h1>
      <p className="text-sm text-text-muted mb-5">Acompanhe seu progresso e os selos que você já desbloqueou.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center shrink-0 ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase text-text-muted block">{kpi.label}</span>
              <span className="text-lg font-bold text-text truncate block">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>Progresso para o Nível {profile.level + 1}</span>
          <span className="font-mono text-text">
            {profile.xp} / {need} XP
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-surface-hover overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {nextUp && (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-surface border border-primary/30 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
          <Sparkles className="absolute -top-3 -right-3 text-primary/10" size={90} />
          <div className="relative flex items-center gap-2 text-xs font-semibold text-primary mb-3 uppercase tracking-wide">
            <Sparkles size={14} /> Próxima conquista
          </div>
          <AchievementCard entry={nextUp} ctx={ctx} highlight />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">Selos</h2>
        <span className="text-xs text-text-muted">
          {unlockedMap.size} de {ACHIEVEMENTS.length} conquistados
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ordered.map((entry) => (
          <AchievementCard key={entry.def.id} entry={entry} ctx={ctx} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({
  entry,
  ctx,
  highlight,
}: {
  entry: { def: AchievementDef; earned?: Achievement; percent: number };
  ctx: AchievementContext;
  highlight?: boolean;
}) {
  const { def, earned, percent } = entry;
  const unlockedAt = earned?.unlockedAt;
  const isEarned = !!unlockedAt;
  const tier = tierFor(def.xp);
  const counter = !isEarned && def.progress ? def.progress(ctx) : null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-2xl border transition-all',
        isEarned ? 'bg-surface border-primary/30 shadow-sm' : 'bg-surface-hover/60 border-border',
        highlight && 'bg-surface border-transparent'
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br shadow-lg',
            isEarned ? tier.glow : 'from-surface-hover to-surface-hover grayscale opacity-60',
            isEarned && `ring-2 ${tier.ring} ${tier.badge}`
          )}
        >
          {def.icon}
        </div>
        {!isEarned && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center">
            <Lock size={10} className="text-text-muted" />
          </div>
        )}
        {isEarned && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('text-sm font-semibold truncate', isEarned ? 'text-text' : 'text-text-muted')}>{def.title}</span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0', tier.chip)}>{tier.label}</span>
          <span className="ml-auto text-[10px] font-mono text-text-muted shrink-0">+{def.xp} XP</span>
        </div>

        {/* O critério fica sempre visível: antes só existia no tooltip, que não
            aparece em tela de toque. */}
        <p className="text-xs text-text-muted leading-snug mt-0.5">
          {isEarned && unlockedAt ? `Conquistado em ${formatDateBR(isoFromTimestamp(unlockedAt))}` : def.description}
        </p>

        {counter && counter.target > 1 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 rounded-full bg-surface overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${percent * 100}%` }} />
            </div>
            <span className="text-[10px] font-mono text-text-muted shrink-0">
              {Math.min(counter.current, counter.target)}/{counter.target}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
