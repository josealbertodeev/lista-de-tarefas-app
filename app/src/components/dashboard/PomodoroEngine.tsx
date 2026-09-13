import { useEffect } from 'react';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import type { PomodoroPhase } from '../../types';

const BASE_TITLE = 'Minhas Tarefas';

const PHASE_LABEL: Record<PomodoroPhase, string> = {
  focus: 'Foco',
  short_break: 'Pausa',
  long_break: 'Pausa longa',
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Mantém o cronômetro vivo em qualquer tela e reflete a contagem no título da aba.
 *
 * O intervalo de 1s é apenas atualização visual — a precisão vem da âncora `endsAt`
 * no store, então o tempo continua correto mesmo com a aba estrangulada em segundo plano.
 */
export function PomodoroEngine() {
  const tick = usePomodoroStore((s) => s.tick);
  const syncFromClock = usePomodoroStore((s) => s.syncFromClock);
  const ensureFreshDay = usePomodoroStore((s) => s.ensureFreshDay);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft);
  const phase = usePomodoroStore((s) => s.phase);

  useEffect(() => {
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);

  // Voltar para a aba (ou acordar o computador) salta direto para o tempo real,
  // em vez de descontar o atraso acumulado um segundo por vez.
  useEffect(() => {
    const onWake = () => {
      ensureFreshDay();
      syncFromClock();
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [syncFromClock, ensureFreshDay]);

  // Contagem no título: é o que torna o timer utilizável com a aba em segundo plano.
  useEffect(() => {
    document.title = isRunning ? `${formatClock(secondsLeft)} · ${PHASE_LABEL[phase]}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [isRunning, secondsLeft, phase]);

  return null;
}
