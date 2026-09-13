import { useProfileStore } from '../stores/useProfileStore';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Um AudioContext criado antes de qualquer gesto do usuário nasce suspenso e
  // engole o primeiro som da sessão sem avisar.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playBeep(frequency = 880, duration = 0.15, volume = 0.15) {
  // Ponto único por onde passam todos os sons: é aqui que o interruptor das
  // configurações precisa ser respeitado.
  if (!useProfileStore.getState().profile.soundEnabled) return;
  try {
    const audioCtx = getCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // audio unavailable, ignore
  }
}

export function playPhaseCompleteSound() {
  playBeep(660, 0.12);
  setTimeout(() => playBeep(880, 0.18), 150);
  setTimeout(() => playBeep(1046, 0.22), 320);
}

export function playTaskCompleteSound() {
  playBeep(988, 0.1);
  setTimeout(() => playBeep(1318, 0.14), 100);
}

export function notificationsSupported(): boolean {
  return typeof Notification !== 'undefined';
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

/**
 * Pede permissão de notificação. Deve ser chamada a partir de uma ação do usuário
 * (o interruptor nas configurações) — nunca de dentro de um timer.
 */
export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Dispara uma notificação do sistema. Retorna false quando não foi possível.
 *
 * Não pede permissão: fazer isso a partir de um timer em segundo plano interrompia
 * o usuário num momento aleatório e ainda perdia a notificação que causou o pedido.
 * A permissão é solicitada nas configurações, por ensureNotificationPermission.
 */
export function notify(title: string, body: string, tag?: string): boolean {
  if (!notificationsSupported()) return false;
  if (!useProfileStore.getState().profile.notificationsEnabled) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    // `tag` evita que avisos repetidos empilhem na bandeja do sistema.
    new Notification(title, { body, icon: '/favicon.svg', tag });
    return true;
  } catch {
    return false;
  }
}
