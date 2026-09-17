import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Classes aplicadas a um input quando o campo está inválido. */
export const inputErrorClass = 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/30';

/** Mensagem de erro exibida abaixo de um campo. */
export function FieldError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={cn('mt-1 flex items-start gap-1 text-xs text-red-400 error-shake', className)}>
      <AlertCircle size={12} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/** Resumo no topo do formulário quando há campos inválidos. */
export function ErrorSummary({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs error-shake',
        className
      )}
    >
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>
        {count === 1
          ? 'Corrija o campo destacado abaixo para continuar.'
          : `Corrija os ${count} campos destacados abaixo para continuar.`}
      </span>
    </div>
  );
}
