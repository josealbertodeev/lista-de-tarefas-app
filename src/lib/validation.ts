/**
 * Validações de formulário compartilhadas.
 * Cada função devolve a mensagem de erro em português ou `undefined` quando o valor é válido.
 */

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 500;

/** Mapa campo -> mensagem de erro. */
export type FormErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors<K extends string>(errors: FormErrors<K>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Título obrigatório: recusa vazio ou só espaços e limita o tamanho. */
export function validateTitle(raw: string, emptyMessage: string): string | undefined {
  const value = raw.trim();
  if (!value) return emptyMessage;
  if (value.length > TITLE_MAX) return `O título deve ter no máximo ${TITLE_MAX} caracteres.`;
  return undefined;
}

export function validateDescription(raw: string): string | undefined {
  if (raw.trim().length > DESCRIPTION_MAX) return `A descrição deve ter no máximo ${DESCRIPTION_MAX} caracteres.`;
  return undefined;
}

/** Data obrigatória no formato YYYY-MM-DD e existente no calendário. */
export function validateDate(raw: string, emptyMessage: string): string | undefined {
  if (!raw.trim()) return emptyMessage;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return 'Data inválida.';
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return 'Data inválida.';
  if (y < 1970 || y > 2100) return 'Informe um ano entre 1970 e 2100.';
  return undefined;
}

/** Horário obrigatório no formato HH:mm. */
export function validateTime(raw: string, emptyMessage: string): string | undefined {
  if (!raw.trim()) return emptyMessage;
  const match = /^(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return 'Horário inválido.';
  const [, h, m] = match.map(Number);
  if (h > 23 || m > 59) return 'Horário inválido.';
  return undefined;
}

/** Número obrigatório dentro de um intervalo. */
export function validateNumber(
  value: number,
  { min, max, label }: { min: number; max: number; label: string }
): string | undefined {
  if (!Number.isFinite(value)) return `${label} deve ser um número.`;
  if (value < min) return `${label} deve ser no mínimo ${min}.`;
  if (value > max) return `${label} deve ser no máximo ${max}.`;
  return undefined;
}

/** Texto curto obrigatório (unidade de medida, etc.). */
export function validateRequiredText(raw: string, emptyMessage: string, max = 30): string | undefined {
  const value = raw.trim();
  if (!value) return emptyMessage;
  if (value.length > max) return `Use no máximo ${max} caracteres.`;
  return undefined;
}
