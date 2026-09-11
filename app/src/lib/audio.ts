import { useProfileStore } from '../stores/useProfileStore';
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playBeep(frequency = 880, duration = 0.15, volume = 0.15) {
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

export function notify(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (!useProfileStore.getState().profile.notificationsEnabled) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/vite.svg' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}
