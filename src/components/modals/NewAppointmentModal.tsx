import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarPlus, Pencil, Save } from 'lucide-react';
import { Modal } from './Modal';
import { CATEGORIES, CATEGORY_ICONS, PRIORITIES } from '../../types';
import type { Appointment, Category, Priority, Repeat } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { REMINDER_OPTIONS, REPEAT_OPTIONS } from '../../lib/recurrence';
import { cn, todayISO } from '../../lib/utils';
import { hasErrors, validateDate, validateDescription, validateNumber, validateTime, validateTitle } from '../../lib/validation';
import type { FormErrors } from '../../lib/validation';
import { ErrorSummary, FieldError, inputErrorClass } from '../common/FormError';

type ApptField = 'title' | 'date' | 'time' | 'duration' | 'description' | 'repeatEndDate';

const DURATIONS = [15, 30, 60, 90, 120, 180];

export function NewAppointmentModal({
  open,
  onClose,
  defaultDate,
  appointment,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  /** Quando informado, o modal edita este compromisso em vez de criar um novo. */
  appointment?: Appointment | null;
}) {
  const addAppointment = useTaskStore((s) => s.addAppointment);
  const updateAppointment = useTaskStore((s) => s.updateAppointment);
  const isEditing = !!appointment;
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate ?? todayISO());
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Trabalho');
  const [priority, setPriority] = useState<Priority>('Média');
  const [reminder, setReminder] = useState('15min');
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [participants, setParticipants] = useState('');
  const [errors, setErrors] = useState<FormErrors<ApptField>>({});

  // Limpa o erro de um campo assim que o usuário começa a corrigi-lo.
  const clearError = (field: ApptField) => setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  // Carrega os dados do compromisso ao abrir (edicao) ou volta ao estado inicial (criacao).
  useEffect(() => {
    if (!open) return;
    if (appointment) {
      setTitle(appointment.title);
      setDate(appointment.date);
      setTime(appointment.time);
      setDuration(appointment.durationMinutes);
      setLocation(appointment.location ?? '');
      setDescription(appointment.description ?? '');
      setCategory(appointment.category);
      setPriority(appointment.priority);
      setReminder(appointment.reminder);
      setRepeat(appointment.repeat);
      setRepeatEndDate(appointment.repeatEndDate ?? '');
      setParticipants(appointment.participants.join(', '));
    } else {
      setTitle('');
      setDate(defaultDate ?? todayISO());
      setTime('09:00');
      setDuration(30);
      setLocation('');
      setDescription('');
      setCategory('Trabalho');
      setPriority('Média');
      setReminder('15min');
      setRepeat('none');
      setRepeatEndDate('');
      setParticipants('');
    }
    setErrors({});
  }, [open, appointment, defaultDate]);

  const save = () => {
    const found: FormErrors<ApptField> = {
      title: validateTitle(title, 'Dê um título ao compromisso antes de salvar.'),
      date: validateDate(date, 'Escolha a data do compromisso.'),
      time: validateTime(time, 'Escolha o horário do compromisso.'),
      duration: validateNumber(duration, { min: 5, max: 1440, label: 'A duração' }),
      description: validateDescription(description),
      // Uma série que termina antes de começar nunca geraria ocorrência alguma.
      repeatEndDate:
        repeat !== 'none' && repeatEndDate
          ? (validateDate(repeatEndDate, '') ?? (repeatEndDate < date ? 'O término deve ser depois da data inicial.' : undefined))
          : undefined,
    };
    setErrors(found);
    if (hasErrors(found)) return;

    const payload = {
      title: title.trim(),
      date,
      time,
      durationMinutes: duration,
      location: location.trim() || undefined,
      meetUrl: location.toLowerCase().includes('meet') ? 'https://meet.google.com/' : undefined,
      description: description.trim() || undefined,
      category,
      priority,
      reminder,
      repeat,
      repeatEndDate: repeat !== 'none' && repeatEndDate ? repeatEndDate : undefined,
      participants: participants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    };
    if (appointment) updateAppointment(appointment.id, payload);
    else addAppointment(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Compromisso' : 'Novo Compromisso'}
      icon={isEditing ? <Pencil className="text-primary" size={18} /> : <CalendarPlus className="text-primary" size={18} />}
    >
      <div className="space-y-4">
        <ErrorSummary count={Object.values(errors).filter(Boolean).length} />

        <Field label="Título do Compromisso *" error={errors.title}>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            aria-invalid={!!errors.title}
            placeholder="Digite um título descritivo"
            className={cn(
              'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none focus:border-primary/60',
              errors.title && inputErrorClass
            )}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data *" error={errors.date}>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                clearError('date');
              }}
              aria-invalid={!!errors.date}
              className={cn(
                'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none',
                errors.date && inputErrorClass
              )}
            />
          </Field>
          <Field label="Horário *" error={errors.time}>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                clearError('time');
              }}
              aria-invalid={!!errors.time}
              className={cn(
                'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none',
                errors.time && inputErrorClass
              )}
            />
          </Field>
        </div>

        <Field label="Duração" error={errors.duration}>
          <select value={duration} onChange={(e) => { setDuration(Number(e.target.value)); clearError('duration'); }} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none">
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d < 60 ? `${d} minutos` : `${d / 60} hora${d > 60 ? 's' : ''}`}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Local ou link (Google Meet, etc.)">
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
        </Field>

        <Field label="Descrição" error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError('description');
            }}
            rows={2}
            aria-invalid={!!errors.description}
            className={cn(
              'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none resize-none',
              errors.description && inputErrorClass
            )}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c]} {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prioridade">
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Lembrete">
            <select value={reminder} onChange={(e) => setReminder(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none">
              {REMINDER_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Repetir">
            <select value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none">
              {REPEAT_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {repeat !== 'none' && (
          <Field label="Repetir até (opcional)" error={errors.repeatEndDate}>
            <input
              type="date"
              value={repeatEndDate}
              onChange={(e) => {
                setRepeatEndDate(e.target.value);
                clearError('repeatEndDate');
              }}
              aria-invalid={!!errors.repeatEndDate}
              className={cn(
                'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none',
                errors.repeatEndDate && inputErrorClass
              )}
            />
            <p className="text-[11px] text-text-muted mt-1">Deixe em branco para repetir indefinidamente.</p>
          </Field>
        )}

        <Field label="Participantes (opcional, separe por vírgula)">
          <input value={participants} onChange={(e) => setParticipants(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
        </Field>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-xl border border-border text-text hover:bg-surface-hover transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="w-full sm:flex-1 min-w-0 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dim active:scale-[0.98] text-white font-semibold whitespace-nowrap shadow-sm shadow-primary/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Save size={16} className="shrink-0" />
            {isEditing ? 'Salvar Alterações' : 'Salvar Compromisso'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-muted mb-1 block">{label}</label>
      {children}
      <FieldError message={error} />
    </div>
  );
}
