import { describe, it, expect, afterEach, vi } from 'vitest';
import { localISO, todayISO, isoFromTimestamp, addDaysISO, isToday, isPast, uid } from './utils';

afterEach(() => {
  vi.useRealTimers();
});

/** Fixa o relógio num instante UTC e roda o corpo do teste. */
function at(utcISO: string, run: () => void) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(utcISO));
  run();
}

describe('localISO / todayISO', () => {
  it('usa o dia LOCAL, não o UTC, no fim da noite', () => {
    // 13/09/2026 23:30 no fuso local. Se a máquina estiver em UTC-3, isso é 14/09 02:30 UTC:
    // a implementação antiga (toISOString) devolveria '2026-09-14'.
    at('2026-09-13T23:30:00', () => {
      expect(todayISO()).toBe(localISO(new Date()));
      expect(todayISO()).toBe('2026-09-13');
    });
  });

  it('devolve o mesmo dia no começo da manhã', () => {
    at('2026-09-13T00:15:00', () => {
      expect(todayISO()).toBe('2026-09-13');
    });
  });

  it('formata uma data específica sem deslocamento', () => {
    expect(localISO(new Date(2026, 0, 31, 22, 0, 0))).toBe('2026-01-31');
    expect(localISO(new Date(2026, 11, 31, 23, 59, 0))).toBe('2026-12-31');
  });
});

describe('isoFromTimestamp', () => {
  it('converte um timestamp UTC para o dia local', () => {
    // completedAt é gravado como ISO UTC completo.
    const completedAt = new Date(2026, 8, 13, 22, 10, 0).toISOString();
    expect(isoFromTimestamp(completedAt)).toBe('2026-09-13');
  });
});

describe('addDaysISO', () => {
  it('avança e retrocede dias', () => {
    expect(addDaysISO('2026-09-13', 1)).toBe('2026-09-14');
    expect(addDaysISO('2026-09-13', -1)).toBe('2026-09-12');
    expect(addDaysISO('2026-09-13', 0)).toBe('2026-09-13');
  });

  it('cruza viradas de mês e de ano', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('trata ano bissexto', () => {
    expect(addDaysISO('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysISO('2024-02-29', 1)).toBe('2024-03-01');
  });

  it('atravessa a mudança de horário de verão sem pular um dia', () => {
    // Horários de verão mudam a duração do dia; somar 86400000ms erraria aqui.
    expect(addDaysISO('2025-10-18', 1)).toBe('2025-10-19');
    expect(addDaysISO('2025-02-15', 1)).toBe('2025-02-16');
  });
});

describe('isToday / isPast', () => {
  it('não marca uma tarefa de hoje como atrasada às 22h', () => {
    at('2026-09-13T22:00:00', () => {
      expect(isToday('2026-09-13')).toBe(true);
      expect(isPast('2026-09-13')).toBe(false);
      expect(isPast('2026-09-12')).toBe(true);
    });
  });

  it('lida com valores ausentes', () => {
    expect(isToday(undefined)).toBe(false);
    expect(isPast(undefined)).toBe(false);
  });
});

describe('uid', () => {
  it('gera identificadores únicos no formato UUID', () => {
    const ids = new Set(Array.from({ length: 200 }, () => uid()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
