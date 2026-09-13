import { useMemo, useState } from 'react';
import { Award, Flame, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useProfileStore, titleForLevel } from '../../stores/useProfileStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { xpForLevel, cn, formatDateBR, isoFromTimestamp } from '../../lib/utils';
import { useToday } from '../../lib/useToday';
import { ACHIEVEMENTS, achievementPercent } from '../../lib/achievements';
import type { AchievementContext, AchievementDef } from '../../lib/achievements';

/** Quantos selos aparecem antes de expandir a lista. */
const COLLAPSED_COUNT = 4;

export function AchievementsCard() {
  const profile = useProfileStore((s) => s.profile);
  const unlocked = useProfileStore((s) => s.achievements);
  const tasks = useTaskStore((s) => s.tasks);
  const sessionsCompletedToday = usePomodoroStore((s) => s.sessionsCompletedToday);
  const today = useToday();
  const [expanded, setExpanded] = useState(false);

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

  const visible = expanded ? ordered : ordered.slice(0, COLLAPSED_COUNT);

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

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text">Selos</span>
          <span className="text-[11px] text-text-muted">
            {unlockedMap.size} de {ACHIEVEMENTS.length} conquistados
          </span>
        </div>

        <div className="space-y-1.5">
          {visible.map(({ def, earned, percent: pct }) => (
            <AchievementRow
              key={def.id}
              def={def}
              ctx={ctx}
              percent={pct}
              unlockedAt={earned?.unlockedAt}
            />
          ))}
        </div>

        {ordered.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full mt-2 py-1.5 rounded-lg text-[11px] font-medium text-text-muted hover:text-primary hover:bg-surface-hover transition-colors inline-flex items-center justify-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} /> Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Ver todos os {ACHIEVEMENTS.length} selos
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function AchievementRow({
  def,
  ctx,
  percent,
  unlockedAt,
}: {
  def: AchievementDef;
  ctx: AchievementContext;
  percent: number;
  unlockedAt?: string;
}) {
  const earned = !!unlockedAt;
  const counter = !earned && def.progress ? def.progress(ctx) : null;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors',
        earned ? 'bg-primary/5 border-primary/30' : 'bg-surface-hover border-border'
      )}
    >
      <span className={cn('text-lg leading-none mt-0.5 shrink-0', !earned && 'grayscale opacity-50')}>{def.icon}</span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs font-semibold truncate', earned ? 'text-text' : 'text-text-muted')}>
            {def.title}
          </span>
          {earned ? (
            <Check size={11} className="text-primary shrink-0" />
          ) : (
            <span className="text-[10px] text-text-muted shrink-0">+{def.xp} XP</span>
          )}
        </div>

        {/* O critério fica sempre visível: antes só existia no tooltip, que não
            aparece em tela de toque. */}
        <p className="text-[11px] text-text-muted leading-snug">
          {earned && unlockedAt ? `Conquistado em ${formatDateBR(isoFromTimestamp(unlockedAt))}` : def.description}
        </p>

        {counter && counter.target > 1 && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-1 flex-1 rounded-full bg-surface overflow-hidden">
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
