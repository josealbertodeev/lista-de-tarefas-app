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
import { occurrencesBetween } from '../../lib/recurrence';
import { CATEGORY_COLORS } from '../../types';
import { cn } from '../../lib/utils';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DayInfo {
  dots: string[];
  appointments: number;
  tasks: number;
}

export function MonthGrid({ month, selected, onSelect }: { month: Date; selected: string; onSelect: (iso: string) => void }) {
  const tasks = useTaskStore((s) => s.tasks);
  const appointments = useTaskStore((s) => s.appointments);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { locale: ptBR });
    const end = endOfWeek(endOfMonth(month), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const infoByDate = useMemo(() => {
    const map = new Map<string, DayInfo>();
    const bucket = (iso: string) => {
      let entry = map.get(iso);
      if (!entry) {
        entry = { dots: [], appointments: 0, tasks: 0 };
        map.set(iso, entry);
      }
      return entry;
    };
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const entry = bucket(t.dueDate);
      entry.dots.push(CATEGORY_COLORS[t.category]);
      entry.tasks += 1;
    });
    // Ocorrências geradas para a janela visível: uma série semanal marca todas as
    // semanas do mês, não apenas o dia em que foi criada.
    if (days.length > 0) {
      const from = format(days[0], 'yyyy-MM-dd');
      const to = format(days[days.length - 1], 'yyyy-MM-dd');
      occurrencesBetween(appointments, from, to).forEach((a) => {
        const entry = bucket(a.date);
        entry.dots.push(CATEGORY_COLORS[a.category]);
        entry.appointments += 1;
      });
    }
    return map;
  }, [tasks, appointments, days]);

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
          const info = infoByDate.get(iso);
          const dots = info?.dots ?? [];
          const total = dots.length;
          const inMonth = isSameMonth(day, month);
          const active = iso === selected;
          const isToday = isTodayFn(day);
          const hasAppointments = (info?.appointments ?? 0) > 0;
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              title={
                total
                  ? `${format(day, "d 'de' MMMM", { locale: ptBR })} · ${info?.appointments ?? 0} compromisso(s), ${info?.tasks ?? 0} tarefa(s)`
                  : format(day, "d 'de' MMMM", { locale: ptBR })
              }
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border p-1.5 flex flex-col items-center justify-start gap-1 transition-all duration-200 hover:-translate-y-0.5',
                active ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover',
                isToday && !active && 'border-primary/60 bg-primary/5',
                isToday && 'ring-1 ring-primary/40 today-ring',
                !inMonth && 'opacity-35'
              )}
            >
              {/* Faixa no topo do card indicando que o dia tem compromissos agendados */}
              {hasAppointments && <span className="absolute inset-x-0 top-0 h-1 bg-primary" />}

              <span
                className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors',
                  isToday && 'bg-primary text-white font-bold shadow-sm'
                )}
              >
                {format(day, 'd')}
              </span>

              {isToday && <span className="text-[8px] font-semibold uppercase tracking-wide text-primary leading-none">Hoje</span>}

              <div className="flex flex-wrap gap-0.5 justify-center">
                {dots.slice(0, 4).map((color, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>

              {total > 4 && <span className="text-[8px] text-text-muted leading-none">+{total - 4}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center">{format(new Date(), 'd')}</span>
          Hoje
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-1 rounded-sm bg-primary" />
          Dia com compromisso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
          Evento (cor = categoria)
        </span>
      </div>
    </div>
  );
}
