import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday as isTodayFn } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTaskStore } from '../../stores/useTaskStore';
import { CATEGORY_COLORS } from '../../types';
import { cn } from '../../lib/utils';

export function WeekGrid({ week, selected, onSelect }: { week: Date; selected: string; onSelect: (iso: string) => void }) {
  const tasks = useTaskStore((s) => s.tasks);
  const appointments = useTaskStore((s) => s.appointments);

  const days = useMemo(() => {
    const start = startOfWeek(week, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [week]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const dayTasks = tasks.filter((t) => t.dueDate === iso);
          const dayAppts = appointments.filter((a) => a.date === iso);
          const active = iso === selected;
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className={cn(
                'flex flex-col rounded-xl border p-2 min-h-[140px] text-left transition-colors',
                active ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase text-text-muted">{format(day, 'EEE', { locale: ptBR })}</span>
                <span className={cn('text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full', isTodayFn(day) && 'bg-primary text-white')}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {[...dayAppts.map((a) => ({ title: a.title, category: a.category })), ...dayTasks.map((t) => ({ title: t.title, category: t.category }))]
                  .slice(0, 3)
                  .map((item, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate"
                      style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}22`, color: CATEGORY_COLORS[item.category] }}
                    >
                      {item.title}
                    </span>
                  ))}
                {dayTasks.length + dayAppts.length > 3 && (
                  <span className="text-[10px] text-text-muted">+{dayTasks.length + dayAppts.length - 3} mais</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
