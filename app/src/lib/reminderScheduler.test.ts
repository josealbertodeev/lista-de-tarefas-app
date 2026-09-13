import { describe, it, expect } from 'vitest';
import { dueReminders, reminderMessage, GRACE_MS } from './reminderScheduler';
import type { Appointment } from '../types';

function appt(over: Partial<Appointment> & { id: string; date: string }): Appointment {
  return {
    title: 'Reunião de equipe',
    time: '09:00',
    durationMinutes: 30,
    category: 'Trabalho',
    priority: 'Média',
    reminder: '15min',
    repeat: 'none',
    participants: [],
    ...over,
  } as Appointment;
}

/** 15/09/2026 às 09:00, horário local. */
const at = (h: number, m: number) => new Date(2026, 8, 15, h, m, 0, 0);
const none = new Set<string>();

describe('dueReminders', () => {
  const a = [appt({ id: 'a', date: '2026-09-15', time: '09:00', reminder: '15min' })];

  it('não dispara antes da hora', () => {
    expect(dueReminders(a, at(8, 30), none)).toEqual([]);
  });

  it('dispara no minuto configurado', () => {
    const due = dueReminders(a, at(8, 45), none);
    expect(due).toHaveLength(1);
    expect(due[0].occurrenceId).toBe('a@2026-09-15');
    expect(due[0].minutesBefore).toBe(15);
  });

  it('ainda dispara dentro da tolerância, para cobrir o computador suspenso', () => {
    expect(dueReminders(a, at(8, 48), none)).toHaveLength(1);
  });

  it('não dispara depois da tolerância', () => {
    const afterGrace = new Date(at(8, 45).getTime() + GRACE_MS + 1000);
    expect(dueReminders(a, afterGrace, none)).toEqual([]);
  });

  it('não repete um lembrete já disparado', () => {
    expect(dueReminders(a, at(8, 45), new Set(['a@2026-09-15']))).toEqual([]);
  });

  it('ignora compromissos sem lembrete', () => {
    const semLembrete = [appt({ id: 'b', date: '2026-09-15', time: '09:00', reminder: 'none' })];
    expect(dueReminders(semLembrete, at(8, 45), none)).toEqual([]);
    expect(dueReminders(semLembrete, at(9, 0), none)).toEqual([]);
  });

  it('respeita antecedências maiores', () => {
    const umaHora = [appt({ id: 'c', date: '2026-09-15', time: '14:00', reminder: '1h' })];
    expect(dueReminders(umaHora, at(12, 59), none)).toEqual([]);
    expect(dueReminders(umaHora, at(13, 0), none)).toHaveLength(1);
  });

  it('dispara para uma ocorrência de série recorrente', () => {
    // Série semanal criada em 01/09; 15/09 é a terceira ocorrência.
    const semanal = [appt({ id: 'w', date: '2026-09-01', time: '09:00', repeat: 'weekly', reminder: '15min' })];
    const due = dueReminders(semanal, at(8, 45), none);
    expect(due).toHaveLength(1);
    expect(due[0].occurrenceId).toBe('w@2026-09-15');
  });

  it('não dispara numa ocorrência cancelada', () => {
    const semanal = [
      appt({ id: 'w', date: '2026-09-01', time: '09:00', repeat: 'weekly', reminder: '15min', exceptions: ['2026-09-15'] }),
    ];
    expect(dueReminders(semanal, at(8, 45), none)).toEqual([]);
  });
});

describe('reminderMessage', () => {
  const base = { occurrenceId: 'x', appointmentId: 'x', title: 'Dentista', date: '2026-09-15', time: '09:00' };

  it('descreve a antecedência em minutos, horas ou dias', () => {
    expect(reminderMessage({ ...base, minutesBefore: 15 }).title).toBe('Dentista em 15 min');
    expect(reminderMessage({ ...base, minutesBefore: 60 }).title).toBe('Dentista em 1h');
    expect(reminderMessage({ ...base, minutesBefore: 1440 }).title).toBe('Dentista amanhã');
  });

  it('inclui o local quando existe', () => {
    expect(reminderMessage({ ...base, minutesBefore: 15, location: 'Sala 2' }).body).toBe('Às 09:00 · Sala 2');
    expect(reminderMessage({ ...base, minutesBefore: 15 }).body).toBe('Às 09:00');
  });
});
