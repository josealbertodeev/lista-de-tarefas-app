import { useSyncExternalStore } from 'react';
import { localISO } from './utils';

/**
 * Data de hoje (YYYY-MM-DD local) que se atualiza sozinha quando o dia vira.
 *
 * Sem isto, uma aba deixada aberta durante a noite continua mostrando os dados de
 * ontem indefinidamente: nada no app re-renderiza só porque o relógio passou da meia-noite.
 *
 * Um único timer de módulo atende todos os componentes inscritos.
 */

let current = localISO();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function notifyIfDayChanged() {
  const next = localISO();
  if (next === current) return;
  current = next;
  for (const listener of listeners) listener();
}

function msUntilNextMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  return Math.max(1000, midnight.getTime() - now.getTime());
}

function scheduleNextMidnight() {
  if (timer) clearTimeout(timer);
  // Reagendado a cada disparo em vez de um setInterval de 24h: temporizadores longos
  // não sobrevivem ao computador suspender.
  timer = setTimeout(() => {
    notifyIfDayChanged();
    scheduleNextMidnight();
  }, msUntilNextMidnight());
}

function handleWake() {
  // Voltar de uma suspensão é o caminho que mais importa num notebook: o timeout
  // acima pode não ter disparado, então reconferimos a data na hora.
  notifyIfDayChanged();
  scheduleNextMidnight();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    scheduleNextMidnight();
    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
    }
  };
}

function getSnapshot(): string {
  return current;
}

export function useToday(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
