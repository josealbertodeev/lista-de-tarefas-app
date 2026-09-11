import { useMemo, useState } from 'react';
import { CalendarClock, Plus, MapPin, Video } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { todayISO, formatDatePt } from '../../lib/utils';
import { NewAppointmentModal } from '../modals/NewAppointmentModal';

export function UpcomingAppointments() {
  const appointments = useTaskStore((s) => s.appointments);
  const [showModal, setShowModal] = useState(false);
  const today = todayISO();

  const upcoming = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.date >= today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 3),
    [appointments, today]
  );

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-text">
          <CalendarClock className="text-primary" size={20} />
          <h2 className="font-semibold">Próximos Compromissos</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-6 text-sm text-text-muted">
          <div className="text-2xl mb-1">✨</div>
          Nenhum compromisso nas próximas horas
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover border border-border">
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-surface border border-border shrink-0">
                <span className="text-[9px] uppercase text-text-muted">{formatDatePt(a.date).split(' ')[1]}</span>
                <span className="text-sm font-bold text-text">{formatDatePt(a.date).split(' ')[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">{a.title}</p>
                <p className="text-xs text-text-muted flex items-center gap-1 truncate">
                  {a.meetUrl ? <Video size={12} /> : <MapPin size={12} />}
                  {a.location || 'Sem local'}
                </p>
              </div>
              <span className="text-xs font-mono text-text-muted shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      )}

      <NewAppointmentModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
