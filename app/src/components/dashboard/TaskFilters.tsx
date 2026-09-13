import { useEffect, useState } from 'react';
import { Search, X, Star, AlarmClock, ArrowDownWideNarrow, ArrowUpWideNarrow, FilterX } from 'lucide-react';
import { useTaskFilterStore } from '../../stores/useTaskFilterStore';
import { SORT_LABELS } from '../../lib/taskQuery';
import type { TaskSort } from '../../lib/taskQuery';
import { CATEGORIES, CATEGORY_ICONS, PRIORITIES, PRIORITY_COLORS } from '../../types';
import { cn } from '../../lib/utils';

export function TaskFilters({ shown, total }: { shown: number; total: number }) {
  const query = useTaskFilterStore((s) => s.query);
  const setQuery = useTaskFilterStore((s) => s.setQuery);
  const categories = useTaskFilterStore((s) => s.categories);
  const toggleCategory = useTaskFilterStore((s) => s.toggleCategory);
  const priorities = useTaskFilterStore((s) => s.priorities);
  const togglePriority = useTaskFilterStore((s) => s.togglePriority);
  const onlyFavorites = useTaskFilterStore((s) => s.onlyFavorites);
  const toggleFavorites = useTaskFilterStore((s) => s.toggleFavorites);
  const onlyOverdue = useTaskFilterStore((s) => s.onlyOverdue);
  const toggleOverdue = useTaskFilterStore((s) => s.toggleOverdue);
  const sort = useTaskFilterStore((s) => s.sort);
  const setSort = useTaskFilterStore((s) => s.setSort);
  const dir = useTaskFilterStore((s) => s.dir);
  const toggleDirection = useTaskFilterStore((s) => s.toggleDirection);
  const clearFilters = useTaskFilterStore((s) => s.clearFilters);

  // O valor digitado vive localmente e só chega ao store depois de uma pausa:
  // assim cada tecla não dispara uma re-renderização da lista inteira.
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    if (draft === query) return;
    const id = setTimeout(() => setQuery(draft), 150);
    return () => clearTimeout(id);
  }, [draft, query, setQuery]);

  const filtering = shown !== total;

  const handleClear = () => {
    setDraft('');
    clearFilters();
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Buscar por título ou descrição..."
          aria-label="Buscar tarefas"
          className="w-full h-10 pl-9 pr-9 rounded-xl bg-surface-hover border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/60"
        />
        {draft && (
          <button
            onClick={() => setDraft('')}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((category) => {
          const active = categories.includes(category);
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              aria-pressed={active}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1',
                active
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-surface-hover border-border text-text-muted hover:text-text'
              )}
            >
              <span>{CATEGORY_ICONS[category]}</span>
              {category}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRIORITIES.map((priority) => {
          const active = priorities.includes(priority);
          return (
            <button
              key={priority}
              onClick={() => togglePriority(priority)}
              aria-pressed={active}
              className={cn(
                'px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1.5',
                active ? 'border-current' : 'bg-surface-hover border-border text-text-muted hover:text-text'
              )}
              style={active ? { color: PRIORITY_COLORS[priority], backgroundColor: `${PRIORITY_COLORS[priority]}1a` } : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[priority] }} />
              {priority}
            </button>
          );
        })}

        <span className="w-px h-5 bg-border mx-0.5" />

        <button
          onClick={toggleFavorites}
          aria-pressed={onlyFavorites}
          title="Somente favoritas"
          className={cn(
            'p-1.5 rounded-lg border transition-colors',
            onlyFavorites
              ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400'
              : 'bg-surface-hover border-border text-text-muted hover:text-text'
          )}
        >
          <Star size={13} className={cn(onlyFavorites && 'fill-current')} />
        </button>
        <button
          onClick={toggleOverdue}
          aria-pressed={onlyOverdue}
          title="Somente atrasadas"
          className={cn(
            'p-1.5 rounded-lg border transition-colors',
            onlyOverdue ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-surface-hover border-border text-text-muted hover:text-text'
          )}
        >
          <AlarmClock size={13} />
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as TaskSort)}
            aria-label="Ordenar por"
            className="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-surface-hover border border-border text-text focus:outline-none"
          >
            {(Object.keys(SORT_LABELS) as TaskSort[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
          <button
            onClick={toggleDirection}
            title={dir === 'desc' ? 'Ordem decrescente' : 'Ordem crescente'}
            aria-label={dir === 'desc' ? 'Ordem decrescente' : 'Ordem crescente'}
            className="p-1.5 rounded-lg bg-surface-hover border border-border text-text-muted hover:text-text transition-colors"
          >
            {dir === 'desc' ? <ArrowDownWideNarrow size={13} /> : <ArrowUpWideNarrow size={13} />}
          </button>
        </div>
      </div>

      {/* Sem este contador, filtrar parece ter apagado tarefas. */}
      {filtering && (
        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>
            Mostrando <strong className="text-text">{shown}</strong> de {total}
          </span>
          <button onClick={handleClear} className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
            <FilterX size={12} /> Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
