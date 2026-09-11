import { useState } from 'react';
import { PlusCircle, X, Plus } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { CATEGORIES, CATEGORY_ICONS, PRIORITIES } from '../../types';
import type { Category, Priority } from '../../types';
import { cn, todayISO } from '../../lib/utils';

export function TaskCreateBox() {
  const addTask = useTaskStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Trabalho');
  const [priority, setPriority] = useState<Priority>('Média');
  const [dueDate, setDueDate] = useState(todayISO());

  const submit = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), category, priority, dueDate, pomodoroEstimate: 1 });
    setTitle('');
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-text">
          <PlusCircle className="text-primary" size={20} />
          <h2 className="font-semibold">Criar Nova Tarefa</h2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="O que precisa ser feito hoje? Ex: Revisar sprint trimestral..."
            className="w-full h-12 pl-4 pr-10 rounded-xl bg-surface-hover border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
          {title && (
            <button onClick={() => setTitle('')} className="absolute right-2 top-2 p-2 text-text-muted hover:text-text">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1',
                  category === cat
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-surface-hover border-border text-text-muted hover:text-text'
                )}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-hover border border-border text-text focus:outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  ⭐ {p}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-hover border border-border text-text focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={submit}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Adicionar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
