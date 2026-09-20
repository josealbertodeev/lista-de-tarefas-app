import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Marca como feriado qualquer tarefa/compromisso cujo título mencione a palavra. */
export function isHolidayTitle(title: string): boolean {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .includes('feriado');
}

export function uid(): string {
  // crypto.randomUUID só existe em contexto seguro (https/localhost). Ao abrir o app
  // pelo IP da rede local (http://192.168.x.x) ele é undefined, então precisamos do fallback.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Data no formato YYYY-MM-DD no fuso LOCAL.
 * Usa o mesmo `format` do date-fns que MonthGrid/WeekGrid usam, para que esta função
 * e o `isToday` do date-fns nunca discordem sobre qual é o dia de hoje.
 */
export function localISO(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return localISO();
}

/**
 * Converte um timestamp ISO completo (createdAt/completedAt, gravados em UTC)
 * para a data YYYY-MM-DD do fuso local. Fazer `.slice(0, 10)` no timestamp
 * devolveria a data em UTC, que vira o dia seguinte no fim da tarde no Brasil.
 */
export function isoFromTimestamp(timestamp: string): string {
  return localISO(new Date(timestamp));
}

export function nowHM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDatePt(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Dia e mês separados, para o quadradinho de data dos cards. */
export function formatDayMonthPt(iso?: string): { day: string; month: string } {
  if (!iso) return { day: '', month: '' };
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    day: String(d).padStart(2, '0'),
    // pt-BR devolve "set." — tiramos o ponto; a caixa alta fica no CSS.
    month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
  };
}

export function formatDateBR(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function isToday(iso?: string): boolean {
  return !!iso && iso === todayISO();
}

export function isPast(iso?: string): boolean {
  if (!iso) return false;
  return iso < todayISO();
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return localISO(date);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}
