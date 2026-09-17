import { describe, it, expect } from 'vitest';
import { easterSunday, holidayOn, holidaysForYear } from './holidays';

describe('Páscoa', () => {
  it('calcula o domingo de Páscoa de anos conhecidos', () => {
    expect(easterSunday(2024)).toBe('2024-03-31');
    expect(easterSunday(2025)).toBe('2025-04-20');
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
  });
});

describe('feriados fixos', () => {
  it('reconhece 7 de setembro em qualquer ano', () => {
    expect(holidayOn('2026-09-07')).toBe('Independência do Brasil');
    expect(holidayOn('2027-09-07')).toBe('Independência do Brasil');
  });

  it('reconhece os demais feriados fixos', () => {
    expect(holidayOn('2026-01-01')).toBe('Confraternização Universal');
    expect(holidayOn('2026-04-21')).toBe('Tiradentes');
    expect(holidayOn('2026-05-01')).toBe('Dia do Trabalho');
    expect(holidayOn('2026-10-12')).toBe('Nossa Senhora Aparecida');
    expect(holidayOn('2026-11-02')).toBe('Finados');
    expect(holidayOn('2026-11-15')).toBe('Proclamação da República');
    expect(holidayOn('2026-11-20')).toBe('Consciência Negra');
    expect(holidayOn('2026-12-25')).toBe('Natal');
  });

  it('não marca um dia comum', () => {
    expect(holidayOn('2026-09-08')).toBeUndefined();
    expect(holidayOn('2026-06-15')).toBeUndefined();
  });
});

describe('feriados móveis', () => {
  it('posiciona Carnaval, Sexta-feira Santa e Corpus Christi a partir da Páscoa', () => {
    // Páscoa de 2026 cai em 05/04.
    expect(holidayOn('2026-02-16')).toBe('Carnaval');
    expect(holidayOn('2026-02-17')).toBe('Carnaval');
    expect(holidayOn('2026-04-03')).toBe('Sexta-feira Santa');
    expect(holidayOn('2026-06-04')).toBe('Corpus Christi');
  });
});

describe('holidaysForYear', () => {
  it('devolve o mesmo mapa em chamadas repetidas', () => {
    expect(holidaysForYear(2026)).toBe(holidaysForYear(2026));
  });
});
