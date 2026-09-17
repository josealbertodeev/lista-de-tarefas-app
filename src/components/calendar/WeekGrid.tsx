import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday as isTodayFn } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTaskStore } from '../../stores/useTaskStore';
import { occurrencesBetween } from '../../lib/recurrence';
import { holidayOn } from '../../lib/holidays';
import { CATEGORY_COLORS } from '../../types';
import type { Category } from '../../types';
import { cn, isHolidayTitle } from '../../lib/utils';

export function WeekGrid({ week, selected, onSelect }: { week: Date; selected: string; onSelect: (iso: string) => void }) {
  const tasks = useTaskStore((s) => s.tasks);
  const appointments = useTaskStore((s) => s.appointments);

  const days = useMemo(() => {
    const start = startOfWeek(week, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [week]);

  // Compromissos da semana já expandidos, agrupados por dia.
  const apptsByDay = useMemo(() => {
    const map = new Map<string, { title: string; category: Category; description?: string }[]>();
    if (days.length === 0) return map;
    const from = format(days[0], 'yyyy-MM-dd');
    const to = format(days[days.length - 1], 'yyyy-MM-dd');
    for (const occurrence of occurrencesBetween(appointments, from, to)) {
      const list = map.get(occurrence.date) ?? [];
      list.push({ title: occurrence.title, category: occurrence.category, description: occurrence.description });
      map.set(occurrence.date, list);
    }
    return map;
  }, [appointments, days]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const dayTasks = tasks.filter((t) => t.dueDate === iso);
          const dayAppts = apptsByDay.get(iso) ?? [];
          const active = iso === selected;
          const isToday = isTodayFn(day);
          const weekday = day.getDay();
          const isWeekend = weekday === 0 || weekday === 6;
          const items = [
            ...dayAppts,
            ...dayTasks.map((t) => ({ title: t.title, category: t.category, description: t.description })),
          ];
          // Feriado nacional vem da tabela; um título com "feriado" cobre os municipais.
          const holidayName =
            holidayOn(iso) ??
            items.find((item) => isHolidayTitle(item.title) || isHolidayTitle(item.description ?? ''))?.title;
          const isHoliday = !!holidayName;
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              title={holidayName}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-xl border p-2 min-h-[140px] text-left transition-all duration-200 hover:-translate-y-0.5',
                active ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover',
                isToday && !active && 'border-primary/60 bg-primary/10',
                isToday && 'ring-1 ring-primary/40 today-ring',
                isHoliday && !active && 'border-amber-400/70 bg-amber-400/5',
                // Espaço extra embaixo para o conteúdo não encostar na faixa "Feriado".
                isHoliday && 'pb-5'
              )}
            >
              {/* Faixa no topo do card indicando que o dia tem compromissos agendados */}
              {dayAppts.length > 0 && (
                <span className={cn('absolute inset-x-0 top-0 h-1', isHoliday ? 'bg-amber-400' : 'bg-primary')} />
              )}

              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    'text-[10px] uppercase',
                    isToday ? 'text-primary font-bold' : isWeekend ? 'text-red-400 font-semibold' : 'text-text-muted'
                  )}
                >
                  {isToday ? 'Hoje' : format(day, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full',
                    isToday ? 'bg-primary text-white shadow-sm' : isHoliday && 'text-amber-400 font-bold'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {items.slice(0, 3).map((item, i) =>
                  isHolidayTitle(item.title) || isHolidayTitle(item.description ?? '') ? (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate bg-amber-400/15 text-amber-400"
                    >
                      {item.title}
                    </span>
                  ) : (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate"
                      style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}22`, color: CATEGORY_COLORS[item.category] }}
                    >
                      {item.title}
                    </span>
                  )
                )}
                {dayTasks.length + dayAppts.length > 3 && (
                  <span className="text-[10px] text-text-muted">+{dayTasks.length + dayAppts.length - 3} mais</span>
                )}
              </div>

              {/* Faixa preenchida no rodapé: é o que anuncia o feriado à distância. */}
              {isHoliday && (
                <span className="absolute inset-x-0 bottom-0 bg-amber-500 py-0.5 text-center text-[8px] font-extrabold uppercase tracking-wider text-slate-900">
                  Feriado
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
