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

let whiteNoiseNode: AudioBufferSourceNode | null = null;

export function startWhiteNoise() {
  if (whiteNoiseNode) return;
  const audioCtx = getCtx();
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.04;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
  whiteNoiseNode = source;
}

export function stopWhiteNoise() {
  whiteNoiseNode?.stop();
  whiteNoiseNode = null;
}

export function notify(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/vite.svg' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}
