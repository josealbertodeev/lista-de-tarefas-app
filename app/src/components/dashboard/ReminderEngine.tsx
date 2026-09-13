import { useCallback, useEffect } from 'react';
import { useTaskStore } from '../../stores/useTaskStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { dueReminders, reminderMessage } from '../../lib/reminderScheduler';
import { occurrencesBetween } from '../../lib/recurrence';
import { notify, playBeep } from '../../lib/audio';
import { addDaysISO, todayISO } from '../../lib/utils';

const CHECK_INTERVAL_MS = 30_000;

/**
 * Dispara os lembretes dos compromissos.
 *
 * Limitação assumida: só funciona com o app aberto em alguma aba. Sem servidor não
 * há push, e Periodic Background Sync exige PWA instalado e só existe no Chrome —
 * por isso as Configurações avisam explicitamente que os lembretes dependem do app aberto.
 */
export function ReminderEngine() {
  const appointments = useTaskStore((s) => s.appointments);
  const firedReminderIds = useNotificationStore((s) => s.firedReminderIds);
  const markReminderFired = useNotificationStore((s) => s.markReminderFired);
  const pruneReminders = useNotificationStore((s) => s.pruneReminders);

  const check = useCallback(() => {
    const fired = new Set(firedReminderIds);
    const due = dueReminders(appointments, new Date(), fired);
    if (due.length === 0) return;

    for (const reminder of due) {
      const { title, body } = reminderMessage(reminder);
      // A tag mantém um aviso por ocorrência na bandeja, em vez de empilhar.
      notify(title, body, reminder.occurrenceId);
      playBeep(880, 0.18);
    }
    markReminderFired(due.map((r) => r.occurrenceId));
  }, [appointments, firedReminderIds, markReminderFired]);

  useEffect(() => {
    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    // Verificar ao voltar para a aba é o que recupera lembretes perdidos
    // enquanto o computador estava suspenso.
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [check]);

  // Mantém apenas o registro de ocorrências ainda próximas, para a lista não crescer
  // indefinidamente com o passar dos meses.
  useEffect(() => {
    const today = todayISO();
    const live = occurrencesBetween(appointments, addDaysISO(today, -2), addDaysISO(today, 2));
    pruneReminders(live.map((o) => o.occurrenceId));
  }, [appointments, pruneReminders]);

  return null;
}
