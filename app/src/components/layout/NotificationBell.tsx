import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, AlarmClock, CalendarClock, Clock, Target, CheckCheck, BellOff } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { buildNotifications } from '../../lib/notifications';
import type { AppNotification, NotificationKind } from '../../lib/notifications';
import { notify } from '../../lib/audio';
import { cn } from '../../lib/utils';
import { useToday } from '../../lib/useToday';
import type { AppView } from '../../App';

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  overdue: AlarmClock,
  today: Clock,
  soon: Clock,
  appointment: CalendarClock,
  goal: Target,
};

const KIND_STYLE: Record<NotificationKind, string> = {
  overdue: 'text-red-500 bg-red-500/10',
  today: 'text-amber-500 bg-amber-500/10',
  soon: 'text-sky-500 bg-sky-500/10',
  appointment: 'text-violet-500 bg-violet-500/10',
  goal: 'text-emerald-500 bg-emerald-500/10',
};

export function NotificationBell({ onNavigate }: { onNavigate: (v: AppView) => void }) {
  const tasks = useTaskStore((s) => s.tasks);
  const appointments = useTaskStore((s) => s.appointments);
  const goals = useTaskStore((s) => s.goals);
  const { readIds, pushedIds, markRead, markPushed, prune } = useNotificationStore();
  const notificationsEnabled = useProfileStore((s) => s.profile.notificationsEnabled);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = useToday();

  // O feed é classificado por data, então precisa ser refeito quando o dia vira
  // com a aba aberta — daí "today" ser passado explicitamente.
  const notifications = useMemo(
    () => buildNotifications(tasks, appointments, goals, today),
    [tasks, appointments, goals, today]
  );

  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const unread = notifications.filter((n) => !readSet.has(n.id));

  // Forget bookkeeping for notifications that are gone (task completed, deleted, ...).
  useEffect(() => {
    prune(notifications.map((n) => n.id));
  }, [notifications, prune]);

  // Push overdue items to the OS once each, only if the user allows it.
  useEffect(() => {
    if (!notificationsEnabled) return;
    const pushed = new Set(pushedIds);
    const fresh = notifications.filter((n) => n.kind === 'overdue' && !pushed.has(n.id));
    if (fresh.length === 0) return;
    const [first] = fresh;
    notify(
      fresh.length === 1 ? 'Tarefa atrasada' : `${fresh.length} tarefas atrasadas`,
      fresh.length === 1 ? `${first.title} — ${first.detail}` : `Começando por: ${first.title}`,
      'tarefas-atrasadas'
    );
    markPushed(fresh.map((n) => n.id));
  }, [notifications, notificationsEnabled, pushedIds, markPushed]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openItem = (n: AppNotification) => {
    markRead([n.id]);
    onNavigate(n.target);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread.length > 0 ? `Notificações (${unread.length} não lidas)` : 'Notificações'}
        aria-expanded={open}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open ? 'bg-surface-hover text-text' : 'text-text-muted hover:bg-surface-hover hover:text-text'
        )}
      >
        <Bell size={18} />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-h-[70vh] flex flex-col bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-text">Notificações</p>
              <p className="text-xs text-text-muted">
                {unread.length > 0 ? `${unread.length} não lida${unread.length > 1 ? 's' : ''}` : 'Tudo em dia'}
              </p>
            </div>
            {unread.length > 0 && (
              <button
                onClick={() => markRead(notifications.map((n) => n.id))}
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
              >
                <CheckCheck size={14} />
                Marcar lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-text-muted">
                <BellOff size={24} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">Nenhum prazo por perto.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = KIND_ICON[n.kind];
                const isRead = readSet.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/60 last:border-b-0 hover:bg-surface-hover transition-colors',
                      !isRead && 'bg-primary/5'
                    )}
                  >
                    <span className={cn('mt-0.5 p-1.5 rounded-lg shrink-0', KIND_STYLE[n.kind])}>
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm truncate text-text', !isRead && 'font-semibold')}>
                        {n.title}
                      </span>
                      <span className="block text-xs text-text-muted">{n.detail}</span>
                    </span>
                    {!isRead && <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {!notificationsEnabled && (
            <p className="px-4 py-2 text-[11px] text-text-muted border-t border-border">
              Notificações do navegador estão desligadas nas configurações.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
