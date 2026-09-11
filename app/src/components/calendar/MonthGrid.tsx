import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday as isTodayFn,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTaskStore } from '../../stores/useTaskStore';
import { CATEGORY_COLORS } from '../../types';
import { cn } from '../../lib/utils';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function MonthGrid({ month, selected, onSelect }: { month: Date; selected: string; onSelect: (iso: string) => void }) {
  const tasks = useTaskStore((s) => s.tasks);
  const appointments = useTaskStore((s) => s.appointments);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { locale: ptBR });
    const end = endOfWeek(endOfMonth(month), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      map.set(t.dueDate, [...(map.get(t.dueDate) ?? []), CATEGORY_COLORS[t.category]]);
    });
    appointments.forEach((a) => {
      map.set(a.date, [...(map.get(a.date) ?? []), CATEGORY_COLORS[a.category]]);
    });
    return map;
  }, [tasks, appointments]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-text-muted py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const dots = eventsByDate.get(iso) ?? [];
          const inMonth = isSameMonth(day, month);
          const active = iso === selected;
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className={cn(
                'aspect-square rounded-xl border p-1.5 flex flex-col items-center justify-start gap-1 transition-colors',
                active ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover',
                !inMonth && 'opacity-35'
              )}
            >
              <span
                className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  isTodayFn(day) && 'bg-primary text-white'
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {dots.slice(0, 4).map((color, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
