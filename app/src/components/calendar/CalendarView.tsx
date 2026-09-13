import { useState } from 'react';
import { addMonths, addWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Rows3, Plus } from 'lucide-react';
import { MonthGrid } from './MonthGrid';
import { WeekGrid } from './WeekGrid';
import { DayPanel } from './DayPanel';
import { cn, todayISO } from '../../lib/utils';
import { useToday } from '../../lib/useToday';
import { NewAppointmentModal } from '../modals/NewAppointmentModal';

export function CalendarView() {
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(todayISO());
  const [showModal, setShowModal] = useState(false);
  const today = useToday();

  const goPrev = () => setCursor((c) => (mode === 'month' ? addMonths(c, -1) : addWeeks(c, -1)));
  const goNext = () => setCursor((c) => (mode === 'month' ? addMonths(c, 1) : addWeeks(c, 1)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-text">Calendário de Tarefas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium text-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={16} /> Agendar Compromisso
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={goPrev} className="p-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-text capitalize min-w-30 text-center">
            {format(cursor, mode === 'month' ? 'MMMM yyyy' : "'Semana de' dd MMM", { locale: ptBR })}
          </span>
          <button onClick={goNext} className="p-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => { setCursor(new Date()); setSelected(today); }} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text-muted hover:text-primary hover:border-primary/40">
            🎯 Hoje
          </button>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-hover border border-border">
          <button onClick={() => setMode('month')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', mode === 'month' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted')}>
            <CalendarDays size={14} /> Mês
          </button>
          <button onClick={() => setMode('week')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', mode === 'week' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-text-muted')}>
            <Rows3 size={14} /> Semana
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          {mode === 'month' ? (
            <MonthGrid month={cursor} selected={selected} onSelect={setSelected} />
          ) : (
            <WeekGrid week={cursor} selected={selected} onSelect={setSelected} />
          )}
        </div>
        <DayPanel date={selected} />
      </div>

      <NewAppointmentModal open={showModal} onClose={() => setShowModal(false)} defaultDate={selected} />
    </div>
  );
}
