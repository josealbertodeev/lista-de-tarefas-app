import type { Category, Priority } from '../../types';
import { CATEGORY_ICONS } from '../../types';
import { cn } from '../../lib/utils';

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-surface-hover text-text-muted border border-border',
        className
      )}
    >
      <span>{CATEGORY_ICONS[category]}</span>
      {category}
    </span>
  );
}

const PRIORITY_STYLES: Record<Priority, string> = {
  Baixa: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Média: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  Alta: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  Urgente: 'bg-red-500/10 text-red-500 border-red-500/30',
};

const PRIORITY_DOT: Record<Priority, string> = {
  Baixa: 'bg-emerald-500',
  Média: 'bg-yellow-500',
  Alta: 'bg-orange-500',
  Urgente: 'bg-red-500',
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border',
        PRIORITY_STYLES[priority],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_DOT[priority])} />
      {priority}
    </span>
  );
}
