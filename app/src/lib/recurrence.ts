import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears } from 'date-fns';
import type { Appointment, Repeat } from '../types';
import { localISO } from './utils';

/**
 * Compromissos recorrentes.
 *
 * As ocorrências são DERIVADAS NA LEITURA, não gravadas na criação. O motivo:
 * `repeatEndDate` é opcional, então expandir na escrita exigiria inventar um
 * horizonte e reabastecê-lo para sempre — uma rotina de fundo que este app não tem
 * onde rodar. Editar a série também continua sendo a alteração de um único registro.
 *
 * Em troca, todo ponto que lê compromissos por data precisa usar `occurrencesOn`/
 * `occurrencesBetween`; ler `appointments` direto mostra apenas a primeira ocorrência.
 */

/** Teto de segurança: dados corrompidos não podem travar a renderização. */
const MAX_OCCURRENCES = 500;

export interface Occurrence extends Appointment {
  /** Identidade desta data específica: `${id}@${date}`. */
  occurrenceId: string;
  isRecurring: boolean;
}

export const REMINDER_OPTIONS = [
  { value: 'none', label: 'Sem lembrete', minutes: null },
  { value: '5min', label: '5 minutos antes', minutes: 5 },
  { value: '15min', label: '15 minutos antes', minutes: 15 },
  { value: '30min', label: '30 minutos antes', minutes: 30 },
  { value: '1h', label: '1 hora antes', minutes: 60 },
  { value: '1d', label: '1 dia antes', minutes: 1440 },
] as const;

export const REPEAT_OPTIONS: { value: Repeat; label: string }[] = [
  { value: 'none', label: 'Não repetir' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
  { value: 'yearly', label: 'Anualmente' },
];

export const REPEAT_LABELS: Record<Repeat, string> = {
  none: 'Não repete',
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  monthly: 'Mensalmente',
  yearly: 'Anualmente',
};

export function reminderLabel(value: string): string {
  return REMINDER_OPTIONS.find((r) => r.value === value)?.label ?? value;
}

/** Minutos de antecedência do lembrete, ou null quando não há lembrete. */
export function reminderOffsetMinutes(value: string): number | null {
  return REMINDER_OPTIONS.find((r) => r.value === value)?.minutes ?? null;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addInterval(date: Date, repeat: Repeat, steps: number): Date {
  switch (repeat) {
    case 'daily':
      return addDays(date, steps);
    case 'weekly':
      return addWeeks(date, steps);
    // addMonths/addYears do date-fns fixam a data no último dia do mês quando ele é
    // mais curto: 31/jan + 1 mês => 28/fev. É a semântica adotada aqui.
    case 'monthly':
      return addMonths(date, steps);
    case 'yearly':
      return addYears(date, steps);
    case 'none':
      return date;
  }
}

/** Quantos períodos já se passaram entre a âncora e o início da janela. */
function stepsUntil(anchor: Date, from: Date, repeat: Repeat): number {
  switch (repeat) {
    case 'daily':
      return Math.max(0, differenceInCalendarDays(from, anchor));
    case 'weekly':
      return Math.max(0, Math.floor(differenceInCalendarDays(from, anchor) / 7));
    case 'monthly':
      return Math.max(0, differenceInCalendarMonths(from, anchor));
    case 'yearly':
      return Math.max(0, differenceInCalendarYears(from, anchor));
    case 'none':
      return 0;
  }
}

function toOccurrence(appointment: Appointment, date: string, isRecurring: boolean): Occurrence {
  return { ...appointment, date, occurrenceId: `${appointment.id}@${date}`, isRecurring };
}

/**
 * Todas as ocorrências dentro de [fromISO, toISO], em ordem de data e horário.
 * Datas presentes em `exceptions` são omitidas.
 */
export function occurrencesBetween(appointments: Appointment[], fromISO: string, toISO: string): Occurrence[] {
  if (fromISO > toISO) return [];
  const from = parseISO(fromISO);
  const result: Occurrence[] = [];

  for (const appointment of appointments) {
    const skipped = new Set(appointment.exceptions ?? []);

    if (appointment.repeat === 'none') {
      if (appointment.date >= fromISO && appointment.date <= toISO && !skipped.has(appointment.date)) {
        result.push(toOccurrence(appointment, appointment.date, false));
      }
      continue;
    }

    const anchor = parseISO(appointment.date);
    // O fim da série nunca passa do fim da janela pedida.
    const limit = appointment.repeatEndDate && appointment.repeatEndDate < toISO ? appointment.repeatEndDate : toISO;

    // Salta direto para o primeiro período da janela em vez de percorrer desde a
    // âncora: uma série diária criada há dois anos estouraria o teto de iterações.
    let steps = stepsUntil(anchor, from, appointment.repeat);
    let guard = 0;

    while (guard < MAX_OCCURRENCES) {
      guard += 1;
      const date = localISO(addInterval(anchor, appointment.repeat, steps));
      steps += 1;

      if (date < appointment.date) continue;
      if (date < fromISO) continue;
      if (date > limit) break;
      if (skipped.has(date)) continue;

      result.push(toOccurrence(appointment, date, true));
    }
  }

  return result.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** Ocorrências de um único dia. */
export function occurrencesOn(appointments: Appointment[], iso: string): Occurrence[] {
  return occurrencesBetween(appointments, iso, iso);
}

/** Indica se o dia tem ao menos uma ocorrência — usado pelos indicadores do calendário. */
export function hasOccurrenceOn(appointments: Appointment[], iso: string): boolean {
  return occurrencesOn(appointments, iso).length > 0;
}
