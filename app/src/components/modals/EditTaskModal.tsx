import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Save } from 'lucide-react';
import { Modal } from './Modal';
import type { Task, Category, Priority, TaskStatus } from '../../types';
import { CATEGORIES, CATEGORY_ICONS, PRIORITIES } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { cn, uid } from '../../lib/utils';

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'Em Andamento',
  review: 'Em Revisão',
  completed: 'Concluída',
};

export function EditTaskModal({ open, onClose, task }: { open: boolean; onClose: () => void; task: Task }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const [draft, setDraft] = useState(task);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (open) setDraft(task);
  }, [open, task]);

  if (!open) return null;

  const save = () => {
    updateTask(task.id, draft);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar Tarefa" icon={<Pencil className="text-primary" size={18} />}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block">Título</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none focus:border-primary/60"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-1 block">Descrição / Notas</label>
          <textarea
            value={draft.description ?? ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none focus:border-primary/60 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Categoria</label>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c]} {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Prioridade</label>
            <select
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Status</label>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Vencimento</label>
            <input
              type="date"
              value={draft.dueDate ?? ''}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">Checklist de Subtarefas</label>
          <div className="space-y-1.5">
            {draft.subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setDraft((d) => ({ ...d, subtasks: d.subtasks.map((s) => (s.id === st.id ? { ...s, completed: !s.completed } : s)) }))
                  }
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                    st.completed ? 'bg-primary border-primary text-white' : 'border-text-muted'
                  )}
                >
                  {st.completed && <span className="text-[9px]">✓</span>}
                </button>
                <span className={cn('text-sm text-text flex-1', st.completed && 'line-through text-text-muted')}>{st.title}</span>
                <button
                  onClick={() => setDraft((d) => ({ ...d, subtasks: d.subtasks.filter((s) => s.id !== st.id) }))}
                  className="text-text-muted hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSubtask.trim()) {
                  setDraft((d) => ({ ...d, subtasks: [...d.subtasks, { id: uid(), title: newSubtask.trim(), completed: false }] }));
                  setNewSubtask('');
                }
              }}
              placeholder="Nova subtarefa..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-sm text-text focus:outline-none"
            />
            <button
              onClick={() => {
                if (!newSubtask.trim()) return;
                setDraft((d) => ({ ...d, subtasks: [...d.subtasks, { id: uid(), title: newSubtask.trim(), completed: false }] }));
                setNewSubtask('');
              }}
              className="px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-text-muted hover:text-primary"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text hover:bg-surface-hover transition-colors font-medium">
            Cancelar
          </button>
          <button
            onClick={save}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium transition-colors"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
