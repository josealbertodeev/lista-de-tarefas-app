import { useState } from 'react';
import type { ReactNode } from 'react';
import { Target, Save } from 'lucide-react';
import { Modal } from './Modal';
import { CATEGORIES, CATEGORY_ICONS } from '../../types';
import type { Category } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { addDaysISO, todayISO } from '../../lib/utils';

export function NewGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addGoal = useTaskStore((s) => s.addGoal);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Pessoal');
  const [deadline, setDeadline] = useState(addDaysISO(todayISO(), 30));
  const [hasMetric, setHasMetric] = useState(false);
  const [target, setTarget] = useState(10);
  const [unit, setUnit] = useState('unidades');

  const save = () => {
    if (!title.trim() || !deadline) return;
    addGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      deadline,
      targetMetric: hasMetric ? { current: 0, target, unit } : undefined,
    });
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova Meta" icon={<Target className="text-primary" size={18} />}>
      <div className="space-y-4">
        <Field label="Título da Meta *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none focus:border-primary/60" />
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
          <Field label="Prazo *">
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <input id="hasMetric" type="checkbox" checked={hasMetric} onChange={(e) => setHasMetric(e.target.checked)} className="accent-emerald-500" />
          <label htmlFor="hasMetric" className="text-sm text-text-muted">
            Definir meta numérica (opcional)
          </label>
        </div>

        {hasMetric && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor alvo">
              <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
            </Field>
            <Field label="Unidade">
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none" />
            </Field>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text hover:bg-surface-hover transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={save} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium transition-colors">
            <Save size={16} /> Salvar Meta
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
