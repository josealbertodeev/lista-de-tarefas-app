import { useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarPlus, Save } from 'lucide-react';
import { Modal } from './Modal';
import { CATEGORIES, CATEGORY_ICONS, PRIORITIES } from '../../types';
import type { Category, Priority, Repeat } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { todayISO } from '../../lib/utils';

const REMINDERS = [
  { value: 'none', label: 'Sem lembrete' },
  { value: '5min', label: '5 minutos antes' },
  { value: '15min', label: '15 minutos antes' },
  { value: '30min', label: '30 minutos antes' },
  { value: '1h', label: '1 hora antes' },
  { value: '1d', label: '1 dia antes' },
];

const REPEATS: { value: Repeat; label: string }[] = [
  { value: 'none', label: 'Não repetir' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
  { value: 'yearly', label: 'Anualmente' },
];

const DURATIONS = [15, 30, 60, 90, 120, 180];

export function NewAppointmentModal({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate?: string }) {
  const addAppointment = useTaskStore((s) => s.addAppointment);
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
  const [participants, setParticipants] = useState('');

  const reset = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setParticipants('');
  };

  const save = () => {
    if (!title.trim() || !date || !time) return;
    addAppointment({
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
      participants: participants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Compromisso" icon={<CalendarPlus className="text-primary" size={18} />}>
      <div className="space-y-4">
        <Field label="Título do Compromisso *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite um título descritivo"
            className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none focus:border-primary/60"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data *">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
          </Field>
          <Field label="Horário *">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
          </Field>
        </div>

        <Field label="Duração">
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none">
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

        <Field label="Descrição">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none resize-none" />
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
              {REMINDERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Repetir">
            <select value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none">
              {REPEATS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Participantes (opcional, separe por vírgula)">
          <input value={participants} onChange={(e) => setParticipants(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text hover:bg-surface-hover transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={save} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium transition-colors">
            <Save size={16} /> Salvar Compromisso
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-muted mb-1 block">{label}</label>
      {children}
    </div>
  );
}
