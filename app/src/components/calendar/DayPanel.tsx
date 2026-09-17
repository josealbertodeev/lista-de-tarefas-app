import { useMemo, useState } from 'react';
import { Pencil, Trash2, Clock, MapPin, Eye, Repeat, PartyPopper } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import type { Appointment } from '../../types';
import { CategoryBadge, PriorityBadge } from '../common/Badge';
import { Modal, ConfirmDialog } from '../modals/Modal';
import { NewAppointmentModal } from '../modals/NewAppointmentModal';
import { AppointmentDetailsModal } from '../modals/AppointmentDetailsModal';
import { occurrencesOn } from '../../lib/recurrence';
import type { Occurrence } from '../../lib/recurrence';
import { REPEAT_LABELS } from '../../lib/recurrence';
import { holidayOn } from '../../lib/holidays';
import { cn, isHolidayTitle } from '../../lib/utils';

export function DayPanel({ date }: { date: string }) {
  const allTasks = useTaskStore((s) => s.tasks);
  const allAppointments = useTaskStore((s) => s.appointments);
  const deleteAppointment = useTaskStore((s) => s.deleteAppointment);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const skipOccurrence = useTaskStore((s) => s.skipOccurrence);
  const [removing, setRemoving] = useState<Occurrence | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [viewing, setViewing] = useState<Occurrence | null>(null);

  const tasks = useMemo(() => allTasks.filter((t) => t.dueDate === date), [allTasks, date]);
  // Séries recorrentes só aparecem em todos os dias porque as ocorrências são
  // geradas aqui; filtrar por a.date === date mostraria apenas a primeira.
  const appointments = useMemo(() => occurrencesOn(allAppointments, date), [allAppointments, date]);

  const { dateLabel, isWeekend } = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    const parsed = new Date(y, m - 1, d);
    const weekday = parsed.getDay();
    return {
      dateLabel: parsed.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
      isWeekend: weekday === 0 || weekday === 6,
    };
  }, [date]);

  const items = [
    ...appointments.map((a) => ({ type: 'appointment' as const, time: a.time, data: a })),
    ...tasks.map((t) => ({ type: 'task' as const, time: t.dueTime ?? '--:--', data: t })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const holidayName = holidayOn(date);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="mb-4 flex flex-col items-start gap-1.5">
        <h3 className={cn('font-semibold capitalize', isWeekend ? 'text-red-400' : 'text-text')}>{dateLabel}</h3>
        {holidayName && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/15 px-2 py-1 text-xs font-semibold text-amber-400">
            <PartyPopper size={12} /> Feriado · {holidayName}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">Nada agendado para este dia.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) =>
            item.type === 'appointment' ? (
              <div key={item.data.id} className="p-3 rounded-xl bg-surface-hover border border-border">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-sm font-medium text-text flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{item.data.title}</span>
                    {(isHolidayTitle(item.data.title) || isHolidayTitle(item.data.description ?? '')) && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-amber-400/15 text-amber-400">
                        Feriado
                      </span>
                    )}
                    {item.data.isRecurring && (
                      <span
                        title={REPEAT_LABELS[item.data.repeat]}
                        className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/30"
                      >
                        <Repeat size={9} /> {REPEAT_LABELS[item.data.repeat]}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-mono text-primary shrink-0">{item.data.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={item.data.category} />
                    {item.data.location && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <MapPin size={11} /> {item.data.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewing(item.data)}
                      title="Visualizar compromisso"
                      aria-label="Visualizar compromisso"
                      className="p-1 rounded text-text-muted hover:text-primary hover:bg-surface transition-colors"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => setEditing(item.data)}
                      title="Editar compromisso"
                      aria-label="Editar compromisso"
                      className="p-1 rounded text-text-muted hover:text-text hover:bg-surface transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setRemoving(item.data)}
                      title="Excluir compromisso"
                      aria-label="Excluir compromisso"
                      className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-surface transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={item.data.id} className="p-3 rounded-xl bg-surface-hover border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => toggleTaskCompletion(item.data.id)}
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      item.data.status === 'completed' ? 'bg-primary border-primary text-white' : 'border-text-muted'
                    )}
                  >
                    {item.data.status === 'completed' && <span className="text-[9px]">✓</span>}
                  </button>
                  <span className={cn('text-sm font-medium text-text flex-1', item.data.status === 'completed' && 'line-through text-text-muted')}>
                    {item.data.title}
                  </span>
                  {(isHolidayTitle(item.data.title) || isHolidayTitle(item.data.description ?? '')) && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-amber-400/15 text-amber-400">
                      Feriado
                    </span>
                  )}
                  {item.data.dueTime && (
                    <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                      <Clock size={11} /> {item.data.dueTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <CategoryBadge category={item.data.category} />
                  <PriorityBadge priority={item.data.priority} />
                </div>
              </div>
            )
          )}
        </div>
      )}

      <AppointmentDetailsModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        appointment={viewing}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
      />

      <NewAppointmentModal open={!!editing} onClose={() => setEditing(null)} appointment={editing} />

      {removing?.isRecurring ? (
        <Modal
          open
          onClose={() => setRemoving(null)}
          title="Excluir Compromisso Recorrente"
          icon={<Repeat className="text-primary" size={18} />}
          widthClass="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              <strong className="text-text">{removing.title}</strong> se repete{' '}
              {REPEAT_LABELS[removing.repeat].toLowerCase()}. O que você quer excluir?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  skipOccurrence(removing.id, removing.date);
                  setRemoving(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-border text-text hover:bg-surface-hover transition-colors font-medium text-sm"
              >
                Apenas este dia
              </button>
              <button
                onClick={() => {
                  deleteAppointment(removing.id);
                  setRemoving(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors font-medium text-sm"
              >
                Toda a série
              </button>
              <button
                onClick={() => setRemoving(null)}
                className="w-full py-2.5 px-4 rounded-xl text-text-muted hover:text-text transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      ) : (
        <ConfirmDialog
          open={!!removing}
          onClose={() => setRemoving(null)}
          onConfirm={() => removing && deleteAppointment(removing.id)}
          title="Excluir Compromisso?"
          message="Tem certeza que deseja excluir este compromisso?"
        />
      )}
    </div>
  );
}
