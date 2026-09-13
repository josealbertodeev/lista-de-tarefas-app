import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Target, Save, Pencil } from 'lucide-react';
import { Modal } from './Modal';
import { CATEGORIES, CATEGORY_ICONS } from '../../types';
import type { Category, Goal } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { addDaysISO, clamp, cn, todayISO } from '../../lib/utils';
import {
  hasErrors,
  validateDate,
  validateDescription,
  validateNumber,
  validateRequiredText,
  validateTitle,
} from '../../lib/validation';
import type { FormErrors } from '../../lib/validation';
import { ErrorSummary, FieldError, inputErrorClass } from '../common/FormError';

type GoalField = 'title' | 'description' | 'deadline' | 'current' | 'target' | 'unit';

export function NewGoalModal({
  open,
  onClose,
  goal,
}: {
  open: boolean;
  onClose: () => void;
  /** Quando informado, o modal edita esta meta em vez de criar uma nova. */
  goal?: Goal | null;
}) {
  const addGoal = useTaskStore((s) => s.addGoal);
  const updateGoal = useTaskStore((s) => s.updateGoal);
  const isEditing = !!goal;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Pessoal');
  const [deadline, setDeadline] = useState(addDaysISO(todayISO(), 30));
  const [hasMetric, setHasMetric] = useState(false);
  const [current, setCurrent] = useState(0);
  const [target, setTarget] = useState(10);
  const [unit, setUnit] = useState('unidades');
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<FormErrors<GoalField>>({});

  // Limpa o erro de um campo assim que o usuário começa a corrigi-lo.
  const clearError = (field: GoalField) => setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  // Preenche o formulário ao abrir: dados da meta (edição) ou valores padrão (criação).
  useEffect(() => {
    if (!open) return;
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? '');
      setCategory(goal.category);
      setDeadline(goal.deadline);
      setHasMetric(!!goal.targetMetric);
      setCurrent(goal.targetMetric?.current ?? 0);
      setTarget(goal.targetMetric?.target ?? 10);
      setUnit(goal.targetMetric?.unit ?? 'unidades');
      setProgress(goal.progress);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Pessoal');
      setDeadline(addDaysISO(todayISO(), 30));
      setHasMetric(false);
      setCurrent(0);
      setTarget(10);
      setUnit('unidades');
      setProgress(0);
    }
    setErrors({});
  }, [open, goal]);

  const save = () => {
    const found: FormErrors<GoalField> = {
      title: validateTitle(title, 'Dê um título à meta antes de salvar.'),
      description: validateDescription(description),
      deadline: validateDate(deadline, 'Defina um prazo para a meta.'),
    };
    if (hasMetric) {
      found.target = validateNumber(target, { min: 1, max: 1000000, label: 'O valor alvo' });
      found.current = validateNumber(current, { min: 0, max: 1000000, label: 'O valor atual' });
      // Só compara os dois valores se cada um deles já for válido isoladamente.
      if (!found.current && !found.target && current > target) {
        found.current = 'O valor atual não pode ser maior que o valor alvo.';
      }
      found.unit = validateRequiredText(unit, 'Informe a unidade (ex: páginas, km, horas).');
    }
    setErrors(found);
    if (hasErrors(found)) return;

    const safeTarget = Math.max(1, target);
    const safeCurrent = clamp(current, 0, safeTarget);
    // Com métrica numérica o progresso é derivado dela; sem métrica, vale o valor informado.
    const finalProgress = hasMetric ? Math.round((safeCurrent / safeTarget) * 100) : clamp(progress, 0, 100);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      deadline,
      targetMetric: hasMetric ? { current: safeCurrent, target: safeTarget, unit } : undefined,
      progress: finalProgress,
    };
    if (goal) updateGoal(goal.id, payload);
    else addGoal(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Meta' : 'Nova Meta'}
      icon={isEditing ? <Pencil className="text-primary" size={18} /> : <Target className="text-primary" size={18} />}
    >
      <div className="space-y-4">
        <ErrorSummary count={Object.values(errors).filter(Boolean).length} />

        <Field label="Título da Meta *" error={errors.title}>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            aria-invalid={!!errors.title}
            placeholder="Ex: Ler 12 livros neste ano"
            className={cn(
              'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none focus:border-primary/60',
              errors.title && inputErrorClass
            )}
          />
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
          <Field label="Prazo *" error={errors.deadline}>
            <input
              type="date"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                clearError('deadline');
              }}
              aria-invalid={!!errors.deadline}
              className={cn(
                'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none',
                errors.deadline && inputErrorClass
              )}
            />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <input id="hasMetric" type="checkbox" checked={hasMetric} onChange={(e) => setHasMetric(e.target.checked)} className="accent-emerald-500" />
          <label htmlFor="hasMetric" className="text-sm text-text-muted">
            Definir meta numérica (opcional)
          </label>
        </div>

        {hasMetric ? (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Valor atual" error={errors.current}>
              <input
                type="number"
                value={current}
                onChange={(e) => {
                  setCurrent(Number(e.target.value));
                  clearError('current');
                }}
                aria-invalid={!!errors.current}
                className={cn(
                  'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none',
                  errors.current && inputErrorClass
                )}
              />
            </Field>
            <Field label="Valor alvo" error={errors.target}>
              <input
                type="number"
                value={target}
                onChange={(e) => {
                  setTarget(Number(e.target.value));
                  clearError('target');
                }}
                aria-invalid={!!errors.target}
                className={cn(
                  'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none',
                  errors.target && inputErrorClass
                )}
              />
            </Field>
            <Field label="Unidade" error={errors.unit}>
              <input
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  clearError('unit');
                }}
                aria-invalid={!!errors.unit}
                className={cn(
                  'w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none',
                  errors.unit && inputErrorClass
                )}
              />
            </Field>
          </div>
        ) : (
          <Field label={`Progresso: ${clamp(progress, 0, 100)}%`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={clamp(progress, 0, 100)}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={clamp(progress, 0, 100)}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-20 px-2 py-2 rounded-lg bg-surface-hover border border-border text-text text-sm focus:outline-none"
              />
            </div>
          </Field>
        )}

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
            {isEditing ? 'Salvar Alterações' : 'Salvar Meta'}
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
