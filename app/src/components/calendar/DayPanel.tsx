import { useMemo, useState } from 'react';
import { Pencil, Trash2, Clock, MapPin } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { CategoryBadge, PriorityBadge } from '../common/Badge';
import { ConfirmDialog } from '../modals/Modal';
import { cn } from '../../lib/utils';

export function DayPanel({ date }: { date: string }) {
  const allTasks = useTaskStore((s) => s.tasks);
  const allAppointments = useTaskStore((s) => s.appointments);
  const deleteAppointment = useTaskStore((s) => s.deleteAppointment);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const tasks = useMemo(() => allTasks.filter((t) => t.dueDate === date), [allTasks, date]);
  const appointments = useMemo(() => allAppointments.filter((a) => a.date === date), [allAppointments, date]);

  const dateLabel = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }, [date]);

  const items = [
    ...appointments.map((a) => ({ type: 'appointment' as const, time: a.time, data: a })),
    ...tasks.map((t) => ({ type: 'task' as const, time: t.dueTime ?? '--:--', data: t })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-text capitalize mb-4">{dateLabel}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">Nada agendado para este dia.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) =>
            item.type === 'appointment' ? (
              <div key={item.data.id} className="p-3 rounded-xl bg-surface-hover border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text">{item.data.title}</span>
                  <span className="text-xs font-mono text-primary">{item.data.time}</span>
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
                    <button className="p-1 rounded text-text-muted hover:text-text">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmId(item.data.id)} className="p-1 rounded text-text-muted hover:text-red-400">
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

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteAppointment(confirmId)}
        title="Excluir Compromisso?"
        message="Tem certeza que deseja excluir este compromisso?"
      />
    </div>
  );
}
