import type { ReactNode } from 'react';
import { Eye, Pencil, Clock, CalendarDays, MapPin, Video, Users, Bell, Repeat as RepeatIcon, AlignLeft } from 'lucide-react';
import { Modal } from './Modal';
import type { Appointment } from '../../types';
import { CategoryBadge, PriorityBadge } from '../common/Badge';
import { formatDateBR } from '../../lib/utils';
import { REPEAT_LABELS, reminderLabel } from '../../lib/recurrence';

function endTime(time: string, durationMinutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + durationMinutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export function AppointmentDetailsModal({
  open,
  onClose,
  appointment,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onEdit?: () => void;
}) {
  if (!appointment) return null;

  const duration =
    appointment.durationMinutes < 60
      ? `${appointment.durationMinutes} minutos`
      : `${appointment.durationMinutes / 60} hora${appointment.durationMinutes > 60 ? 's' : ''}`;

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do Compromisso" icon={<Eye className="text-primary" size={18} />}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text leading-snug">{appointment.title}</h3>
          <div className="flex items-center gap-2 mt-2">
            <CategoryBadge category={appointment.category} />
            <PriorityBadge priority={appointment.priority} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Row icon={<CalendarDays size={14} />} label="Data">
            {formatDateBR(appointment.date)}
          </Row>
          <Row icon={<Clock size={14} />} label="Horário">
            {appointment.time} – {endTime(appointment.time, appointment.durationMinutes)} ({duration})
          </Row>
          <Row icon={<Bell size={14} />} label="Lembrete">
            {reminderLabel(appointment.reminder)}
          </Row>
          <Row icon={<RepeatIcon size={14} />} label="Repetição">
            {REPEAT_LABELS[appointment.repeat]}
            {appointment.repeat !== 'none' && appointment.repeatEndDate && (
              <span className="text-text-muted"> · até {formatDateBR(appointment.repeatEndDate)}</span>
            )}
          </Row>
        </div>

        <Row icon={appointment.meetUrl ? <Video size={14} /> : <MapPin size={14} />} label="Local">
          {appointment.meetUrl ? (
            <a href={appointment.meetUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {appointment.location || appointment.meetUrl}
            </a>
          ) : (
            appointment.location || 'Não informado'
          )}
        </Row>

        {appointment.participants.length > 0 && (
          <Row icon={<Users size={14} />} label="Participantes">
            <div className="flex flex-wrap gap-1.5">
              {appointment.participants.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-xs text-text">
                  {p}
                </span>
              ))}
            </div>
          </Row>
        )}

        {appointment.description && (
          <Row icon={<AlignLeft size={14} />} label="Descrição">
            <p className="whitespace-pre-wrap">{appointment.description}</p>
          </Row>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text hover:bg-surface-hover transition-colors font-medium">
            Fechar
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium transition-colors"
            >
              <Pencil size={16} /> Editar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-surface-hover border border-border">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-text-muted mb-1">
        {icon} {label}
      </span>
      <div className="text-sm text-text">{children}</div>
    </div>
  );
}
