import type { Appointment } from '../types';
import { occurrencesBetween, reminderOffsetMinutes } from './recurrence';
import { addDaysISO } from './utils';

/**
 * Decide quais lembretes de compromisso devem tocar agora.
 *
 * Antes, `Appointment.reminder` era gravado pelo formulário e nunca lido por
 * ninguém: escolher "15 minutos antes" não produzia efeito algum.
 */

/**
 * Tolerância depois do horário previsto.
 *
 * É o que faz um computador que estava suspenso na hora do lembrete ainda avisar
 * ao ser aberto, em vez de engolir o aviso silenciosamente.
 */
export const GRACE_MS = 5 * 60 * 1000;

export interface DueReminder {
  /** `${appointmentId}@${date}` — identidade usada para não repetir o aviso. */
  occurrenceId: string;
  appointmentId: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  minutesBefore: number;
}

function toDate(dateISO: string, timeHM: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [h, min] = timeHM.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** Texto do aviso, em função da antecedência configurada. */
export function reminderMessage(reminder: DueReminder): { title: string; body: string } {
  const when =
    reminder.minutesBefore >= 1440
      ? 'amanhã'
      : reminder.minutesBefore >= 60
        ? `em ${reminder.minutesBefore / 60}h`
        : `em ${reminder.minutesBefore} min`;
  return {
    title: `${reminder.title} ${when}`,
    body: `Às ${reminder.time}${reminder.location ? ` · ${reminder.location}` : ''}`,
  };
}

/**
 * Lembretes cuja hora de disparo já chegou e ainda está dentro da tolerância.
 * Pura: recebe o instante atual, o que a torna testável.
 */
export function dueReminders(appointments: Appointment[], now: Date, alreadyFired: Set<string>): DueReminder[] {
  const nowMs = now.getTime();
  const todayISO = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  // Lembretes de 1 dia antes exigem olhar o dia seguinte; ontem entra por causa
  // da tolerância em torno da virada da meia-noite.
  const from = addDaysISO(todayISO, -1);
  const to = addDaysISO(todayISO, 1);

  const due: DueReminder[] = [];

  for (const occurrence of occurrencesBetween(appointments, from, to)) {
    const minutesBefore = reminderOffsetMinutes(occurrence.reminder);
    if (minutesBefore === null) continue;

    const fireAt = toDate(occurrence.date, occurrence.time).getTime() - minutesBefore * 60_000;
    if (nowMs < fireAt || nowMs >= fireAt + GRACE_MS) continue;
    if (alreadyFired.has(occurrence.occurrenceId)) continue;

    due.push({
      occurrenceId: occurrence.occurrenceId,
      appointmentId: occurrence.id,
      title: occurrence.title,
      date: occurrence.date,
      time: occurrence.time,
      location: occurrence.location,
      minutesBefore,
    });
  }

  return due;
}
