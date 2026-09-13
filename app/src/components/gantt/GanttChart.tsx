import { useMemo } from 'react';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../../types';
import { cn, isoFromTimestamp } from '../../lib/utils';
import { useToday } from '../../lib/useToday';

// Todas as categorias entram na linha do tempo. Antes a lista era fixa em três,
// então tarefas em Pessoal, Compras e Outros simplesmente não apareciam aqui.
const GROUPS = CATEGORIES.map((category) => ({ category, label: `${CATEGORY_ICONS[category]} ${category}` }));

const DAY_WIDTH = 44;
const WINDOW_DAYS = 21;

export function GanttChart() {
  const tasks = useTaskStore((s) => s.tasks);
  const goals = useTaskStore((s) => s.goals);

  const today = useToday();
  // Recentraliza sozinho quando o dia vira: antes a janela ficava congelada na montagem.
  const todayDate = useMemo(() => startOfDay(new Date(today + 'T00:00:00')), [today]);
  const rangeStart = useMemo(() => addDays(todayDate, -3), [todayDate]);
  const days = useMemo(() => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(rangeStart, i)), [rangeStart]);
  const todayOffset = differenceInCalendarDays(todayDate, rangeStart);

  const dayOf = (iso: string) => differenceInCalendarDays(new Date(iso + 'T00:00:00'), rangeStart);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-text mb-1">Linha do Tempo & Gráfico Gantt</h1>
      <p className="text-sm text-text-muted mb-5">Visão consolidada de sprints, dependências e marcos.</p>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-x-auto">
        <div style={{ minWidth: 220 + days.length * DAY_WIDTH }}>
          {/* Header row with days */}
          <div className="flex border-b border-border sticky top-0 bg-surface z-10">
            <div className="w-[220px] shrink-0 p-3 text-xs font-semibold text-text-muted">Grupo / Tarefa</div>
            <div className="flex relative">
              {days.map((day, i) => (
                <div key={i} className="shrink-0 text-center py-3 border-l border-border/50" style={{ width: DAY_WIDTH }}>
                  <div className="text-[9px] uppercase text-text-muted">{format(day, 'EEE', { locale: ptBR })}</div>
                  <div className="text-xs font-medium text-text">{format(day, 'd')}</div>
                </div>
              ))}
              {todayOffset >= 0 && todayOffset < days.length && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-400 z-20"
                  style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                >
                  <span className="absolute -top-1 -translate-x-1/2 text-[9px] font-bold text-red-400 bg-surface px-1 rounded">HOJE</span>
                </div>
              )}
            </div>
          </div>

          {GROUPS.map((group) => {
            const groupTasks = tasks.filter((t) => t.category === group.category && t.dueDate);
            if (groupTasks.length === 0) return null;
            return (
              <div key={group.category}>
                <div className="flex bg-surface-hover/60">
                  <div className="w-[220px] shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wide text-text" style={{ color: CATEGORY_COLORS[group.category] }}>
                    {group.label}
                  </div>
                  <div className="flex-1" style={{ width: days.length * DAY_WIDTH }} />
                </div>
                {groupTasks.map((task) => {
                  const startDay = dayOf(isoFromTimestamp(task.createdAt));
                  const endDay = dayOf(task.dueDate!);
                  const clampedStart = Math.max(0, startDay);
                  const clampedEnd = Math.min(days.length - 1, Math.max(endDay, clampedStart));
                  const width = (clampedEnd - clampedStart + 1) * DAY_WIDTH - 6;
                  const left = clampedStart * DAY_WIDTH + 3;
                  return (
                    <div key={task.id} className="flex border-t border-border/40 hover:bg-surface-hover/40">
                      <div className="w-[220px] shrink-0 px-3 py-2.5 flex items-center gap-1.5 text-xs text-text truncate">
                        {task.isCriticalPath && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
                        <span className="truncate">{task.title}</span>
                      </div>
                      <div className="relative flex-1" style={{ width: days.length * DAY_WIDTH, height: 40 }}>
                        <div
                          className={cn(
                            'absolute top-2 h-6 rounded-lg flex items-center px-2 text-[10px] font-medium text-white shadow-sm',
                            task.isCriticalPath && 'ring-1 ring-red-400/70'
                          )}
                          style={{ left, width: Math.max(width, DAY_WIDTH - 6), backgroundColor: CATEGORY_COLORS[task.category] }}
                        >
                          <span className="truncate">{task.pomodorosCompleted}/{task.pomodoroEstimate} 🍅</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Milestones row from goals */}
          {goals.length > 0 && (
            <div>
              <div className="flex bg-surface-hover/60">
                <div className="w-[220px] shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-500">Marcos & Metas</div>
                <div className="flex-1" style={{ width: days.length * DAY_WIDTH }} />
              </div>
              {goals.map((goal) => {
                const d = dayOf(goal.deadline);
                if (d < 0 || d >= days.length) return null;
                return (
                  <div key={goal.id} className="flex border-t border-border/40">
                    <div className="w-[220px] shrink-0 px-3 py-2.5 text-xs text-text truncate">{goal.title}</div>
                    <div className="relative flex-1" style={{ width: days.length * DAY_WIDTH, height: 40 }}>
                      <div
                        className="absolute top-2.5 w-4 h-4 rotate-45 bg-emerald-500 shadow-sm"
                        style={{ left: d * DAY_WIDTH + DAY_WIDTH / 2 - 8 }}
                        title={goal.title}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded rotate-45 bg-emerald-500 inline-block" /> Marco
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-red-400" /> Caminho Crítico
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-px bg-red-400 inline-block" /> Linha do dia atual
        </span>
      </div>
    </div>
  );
}
