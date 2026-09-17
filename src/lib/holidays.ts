import { addDaysISO, localISO } from './utils';

/**
 * Feriados nacionais brasileiros.
 *
 * As datas móveis derivam da Páscoa, calculada pelo algoritmo de Meeus/Jones/Butcher,
 * então qualquer ano funciona sem depender de uma tabela fixa para manter todo ano.
 */

const FIXED: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: 'Confraternização Universal' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalho' },
  { month: 9, day: 7, name: 'Independência do Brasil' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamação da República' },
  { month: 11, day: 20, name: 'Consciência Negra' },
  { month: 12, day: 25, name: 'Natal' },
];

/** Domingo de Páscoa do ano, no fuso local. */
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return localISO(new Date(year, month - 1, day));
}

// Um ano é recalculado uma única vez: o calendário consulta isto a cada célula.
const cache = new Map<number, Map<string, string>>();

/** Mapa de YYYY-MM-DD para o nome do feriado, para todo o ano. */
export function holidaysForYear(year: number): Map<string, string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const map = new Map<string, string>();
  for (const { month, day, name } of FIXED) {
    map.set(localISO(new Date(year, month - 1, day)), name);
  }

  const easter = easterSunday(year);
  map.set(addDaysISO(easter, -48), 'Carnaval');
  map.set(addDaysISO(easter, -47), 'Carnaval');
  map.set(addDaysISO(easter, -2), 'Sexta-feira Santa');
  map.set(addDaysISO(easter, 60), 'Corpus Christi');

  cache.set(year, map);
  return map;
}

/** Nome do feriado nesta data, ou undefined quando é um dia comum. */
export function holidayOn(iso: string): string | undefined {
  const year = Number(iso.slice(0, 4));
  if (!Number.isInteger(year)) return undefined;
  return holidaysForYear(year).get(iso);
}
