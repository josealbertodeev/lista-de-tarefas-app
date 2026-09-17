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
import { holidayOn } from '../../lib/holidays';
import { CATEGORY_COLORS } from '../../types';
import { cn, isHolidayTitle } from '../../lib/utils';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface DayInfo {
  dots: string[];
  appointments: number;
  tasks: number;
  holiday?: string;
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
      if (isHolidayTitle(t.title) || isHolidayTitle(t.description ?? '')) entry.holiday = entry.holiday ?? t.title;
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
        if (isHolidayTitle(a.title) || isHolidayTitle(a.description ?? '')) entry.holiday = entry.holiday ?? a.title;
      });
    }
    return map;
  }, [tasks, appointments, days]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn('text-center text-xs font-semibold py-2', i === 0 || i === 6 ? 'text-red-400' : 'text-text-muted')}
          >
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
          // Feriado nacional vem da tabela; um título com "feriado" cobre os municipais.
          const holidayName = holidayOn(iso) ?? info?.holiday;
          const isHoliday = !!holidayName;
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              title={
                (holidayName ? `${holidayName} · ` : '') +
                (total
                  ? `${format(day, "d 'de' MMMM", { locale: ptBR })} · ${info?.appointments ?? 0} compromisso(s), ${info?.tasks ?? 0} tarefa(s)`
                  : format(day, "d 'de' MMMM", { locale: ptBR }))
              }
              className={cn(
                // Tudo empilhado no fluxo normal: a etiqueta "Hoje" e a faixa "Feriado"
                // nunca se sobrepõem, mesmo quando o dia é os dois ao mesmo tempo.
                // min-h garante que a etiqueta, o número e a faixa caibam mesmo no
                // celular, onde a célula quadrada ficaria baixa demais.
                'relative aspect-square min-h-[72px] overflow-hidden rounded-xl border px-1 pt-1.5 flex flex-col items-center justify-start gap-0.5 transition-all duration-200 hover:-translate-y-0.5',
                active ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover',
                isToday && !active && 'border-primary/60 bg-primary/10',
                isToday && 'ring-1 ring-primary/40 today-ring',
                isHoliday && !active && 'border-amber-400/70 bg-amber-400/5',
                // Espaço reservado embaixo para a faixa "Feriado" não cobrir o conteúdo.
                isHoliday ? 'pb-4' : 'pb-1.5',
                !inMonth && 'opacity-35'
              )}
            >
              {/* Faixa no topo do card indicando que o dia tem compromissos agendados */}
              {hasAppointments && (
                <span className={cn('absolute inset-x-0 top-0 h-1', isHoliday ? 'bg-amber-400' : 'bg-primary')} />
              )}

              {/* Etiqueta do dia atual, com a pontinha apontando para o número */}
              {isToday && (
                <span className="flex flex-col items-center leading-none shrink-0">
                  <span className="px-1.5 py-[2px] rounded-full bg-primary text-white text-[7px] font-bold uppercase tracking-wide shadow-sm">
                    Hoje
                  </span>
                  <span className="w-1 h-1 bg-primary rotate-45 -mt-[2px]" />
                </span>
              )}

              <span
                className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition-colors',
                  isToday ? 'bg-primary text-white font-bold shadow-sm' : isHoliday && 'text-amber-400 font-bold'
                )}
              >
                {format(day, 'd')}
              </span>

              <div className="flex flex-wrap gap-0.5 justify-center">
                {dots.slice(0, 4).map((color, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>

              {total > 4 && <span className="text-[8px] text-text-muted leading-none">+{total - 4}</span>}

              {/* Faixa preenchida no rodapé: é o que anuncia o feriado à distância. */}
              {isHoliday && (
                <span className="absolute inset-x-0 bottom-0 bg-amber-500 py-0.5 text-center text-[7px] font-extrabold uppercase tracking-wider text-slate-900">
                  Feriado
                </span>
              )}
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
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Fim de semana
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Feriado
        </span>
      </div>
    </div>
  );
}
