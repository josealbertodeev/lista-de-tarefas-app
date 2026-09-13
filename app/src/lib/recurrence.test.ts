import { describe, it, expect } from 'vitest';
import { occurrencesBetween, occurrencesOn, reminderOffsetMinutes } from './recurrence';
import type { Appointment } from '../types';

function appt(over: Partial<Appointment> & { id: string; date: string }): Appointment {
  return {
    title: 'Reunião',
    time: '09:00',
    durationMinutes: 30,
    category: 'Trabalho',
    priority: 'Média',
    reminder: 'none',
    repeat: 'none',
    participants: [],
    ...over,
  } as Appointment;
}

const dates = (list: { date: string }[]) => list.map((o) => o.date);

describe('compromissos sem repetição', () => {
  it('aparece só na própria data', () => {
    const a = [appt({ id: 'a', date: '2026-09-15' })];
    expect(dates(occurrencesOn(a, '2026-09-15'))).toEqual(['2026-09-15']);
    expect(occurrencesOn(a, '2026-09-16')).toEqual([]);
  });
});

describe('repetição semanal', () => {
  const weekly = [appt({ id: 'w', date: '2026-09-07', repeat: 'weekly' })];

  it('reaparece a cada 7 dias dentro da janela', () => {
    expect(dates(occurrencesBetween(weekly, '2026-09-07', '2026-10-05'))).toEqual([
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
    ]);
  });

  it('não aparece antes da data de início', () => {
    expect(occurrencesBetween(weekly, '2026-08-01', '2026-09-06')).toEqual([]);
  });

  it('funciona numa janela muito depois da âncora sem estourar o limite', () => {
    // O salto aritmético evita percorrer semana a semana desde 2026.
    const far = occurrencesBetween(weekly, '2030-01-07', '2030-01-21');
    expect(dates(far)).toEqual(['2030-01-07', '2030-01-14', '2030-01-21']);
  });

  it('respeita a data final da série', () => {
    const ending = [appt({ id: 'w', date: '2026-09-07', repeat: 'weekly', repeatEndDate: '2026-09-21' })];
    expect(dates(occurrencesBetween(ending, '2026-09-07', '2026-10-31'))).toEqual([
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
    ]);
  });
});

describe('repetição diária, mensal e anual', () => {
  it('diária', () => {
    const daily = [appt({ id: 'd', date: '2026-09-13', repeat: 'daily' })];
    expect(dates(occurrencesBetween(daily, '2026-09-13', '2026-09-16'))).toEqual([
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
    ]);
  });

  it('mensal fixa no último dia quando o mês é mais curto', () => {
    const monthly = [appt({ id: 'm', date: '2026-01-31', repeat: 'monthly' })];
    expect(dates(occurrencesBetween(monthly, '2026-01-31', '2026-04-30'))).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('anual', () => {
    const yearly = [appt({ id: 'y', date: '2026-03-10', repeat: 'yearly' })];
    expect(dates(occurrencesBetween(yearly, '2026-01-01', '2029-12-31'))).toEqual([
      '2026-03-10',
      '2027-03-10',
      '2028-03-10',
      '2029-03-10',
    ]);
  });
});

describe('exceções', () => {
  it('pula apenas a data cancelada, mantendo o resto da série', () => {
    const weekly = [appt({ id: 'w', date: '2026-09-07', repeat: 'weekly', exceptions: ['2026-09-14'] })];
    expect(dates(occurrencesBetween(weekly, '2026-09-07', '2026-09-28'))).toEqual([
      '2026-09-07',
      '2026-09-21',
      '2026-09-28',
    ]);
  });

  it('também vale para compromissos sem repetição', () => {
    const once = [appt({ id: 'o', date: '2026-09-15', exceptions: ['2026-09-15'] })];
    expect(occurrencesOn(once, '2026-09-15')).toEqual([]);
  });
});

describe('identidade e ordenação', () => {
  it('dá um id próprio a cada ocorrência', () => {
    const weekly = [appt({ id: 'w', date: '2026-09-07', repeat: 'weekly' })];
    const list = occurrencesBetween(weekly, '2026-09-07', '2026-09-14');
    expect(list.map((o) => o.occurrenceId)).toEqual(['w@2026-09-07', 'w@2026-09-14']);
    expect(list[0].isRecurring).toBe(true);
  });

  it('ordena por data e horário', () => {
    const many = [
      appt({ id: 'tarde', date: '2026-09-15', time: '16:00' }),
      appt({ id: 'manha', date: '2026-09-15', time: '08:00' }),
      appt({ id: 'ontem', date: '2026-09-14', time: '23:00' }),
    ];
    expect(occurrencesBetween(many, '2026-09-14', '2026-09-15').map((o) => o.id)).toEqual(['ontem', 'manha', 'tarde']);
  });

  it('devolve vazio quando a janela é invertida', () => {
    expect(occurrencesBetween([appt({ id: 'a', date: '2026-09-15' })], '2026-09-20', '2026-09-10')).toEqual([]);
  });
});

describe('reminderOffsetMinutes', () => {
  it('traduz as opções do formulário em minutos', () => {
    expect(reminderOffsetMinutes('15min')).toBe(15);
    expect(reminderOffsetMinutes('1h')).toBe(60);
    expect(reminderOffsetMinutes('1d')).toBe(1440);
    expect(reminderOffsetMinutes('none')).toBeNull();
    expect(reminderOffsetMinutes('inexistente')).toBeNull();
  });
});
