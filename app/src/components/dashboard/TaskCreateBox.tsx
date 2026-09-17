import { useRef, useState } from 'react';
import { PlusCircle, X, Plus } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { CATEGORIES, CATEGORY_ICONS, PRIORITIES, PRIORITY_COLORS } from '../../types';
import type { Category, Priority } from '../../types';
import { cn, todayISO } from '../../lib/utils';
import { validateDate, validateTitle } from '../../lib/validation';
import type { FormErrors } from '../../lib/validation';
import { FieldError, inputErrorClass } from '../common/FormError';

type TaskField = 'title' | 'dueDate';

export function TaskCreateBox() {
  const addTask = useTaskStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Trabalho');
  const [priority, setPriority] = useState<Priority>('Média');
  const [dueDate, setDueDate] = useState(todayISO());
  const [errors, setErrors] = useState<FormErrors<TaskField>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  const validate = (): FormErrors<TaskField> => ({
    title: validateTitle(title, 'Digite o que precisa ser feito para criar a tarefa.'),
    // O vencimento é opcional: só checamos o formato quando o campo está preenchido.
    dueDate: dueDate.trim() ? validateDate(dueDate, '') : undefined,
  });

  const submit = () => {
    const found = validate();
    setErrors(found);
    if (found.title || found.dueDate) {
      if (found.title) titleRef.current?.focus();
      return;
    }
    addTask({ title: title.trim(), category, priority, dueDate: dueDate.trim() || undefined, pomodoroEstimate: 1 });
    setTitle('');
    setErrors({});
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
            ref={titleRef}
            data-new-task-input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              // Some o erro assim que o usuário começa a corrigir o campo.
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            aria-invalid={!!errors.title}
            placeholder="O que precisa ser feito hoje? Ex: Revisar sprint trimestral..."
            className={cn(
              'w-full h-12 pl-4 pr-10 rounded-xl bg-surface-hover border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30',
              errors.title && inputErrorClass
            )}
          />
          {title && (
            <button onClick={() => setTitle('')} className="absolute right-2 top-2 p-2 text-text-muted hover:text-text">
              <X size={16} />
            </button>
          )}
          <FieldError message={errors.title} />
        </div>

        <FieldError message={errors.dueDate} className="justify-end" />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-hover border border-border text-text focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            style={{ color: PRIORITY_COLORS[priority], borderColor: `${PRIORITY_COLORS[priority]}66` }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-hover border focus:outline-none"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} style={{ color: PRIORITY_COLORS[p] }}>
                ⭐ {p}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
            }}
            aria-invalid={!!errors.dueDate}
            title={errors.dueDate}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-hover border border-border text-text focus:outline-none',
              errors.dueDate && inputErrorClass
            )}
          />
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
