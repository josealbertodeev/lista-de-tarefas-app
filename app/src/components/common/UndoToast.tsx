import { useEffect } from 'react';
import { Undo2, X } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';

const VISIBLE_MS = 6000;

/**
 * Aviso de "desfazer" após uma remoção.
 *
 * É o que substitui o diálogo de confirmação a cada exclusão: confirmar toda vez é
 * atrito diário, enquanto uma janela curta para voltar atrás cobre o erro real.
 */
export function UndoToast() {
  const lastRemoved = useTaskStore((s) => s.lastRemoved);
  const undoRemove = useTaskStore((s) => s.undoRemove);
  const dismissUndo = useTaskStore((s) => s.dismissUndo);
  const removedAt = lastRemoved?.at;

  useEffect(() => {
    if (!removedAt) return;
    const id = setTimeout(dismissUndo, VISIBLE_MS);
    return () => clearTimeout(id);
    // removedAt muda a cada remoção, reiniciando a contagem em exclusões seguidas.
  }, [removedAt, dismissUndo]);

  if (!lastRemoved) return null;

  const count = lastRemoved.tasks.length;

  return (
    <div
      role="status"
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[120] w-[min(26rem,calc(100vw-2rem))] card-rise"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border shadow-2xl">
        <span className="text-sm text-text flex-1 min-w-0 truncate">
          {lastRemoved.label}
          {count === 1 && <span className="text-text-muted"> · {lastRemoved.tasks[0].task.title}</span>}
        </span>
        <button
          onClick={undoRemove}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dim text-white text-xs font-semibold shrink-0 transition-colors"
        >
          <Undo2 size={13} /> Desfazer
        </button>
        <button
          onClick={dismissUndo}
          aria-label="Fechar aviso"
          className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
