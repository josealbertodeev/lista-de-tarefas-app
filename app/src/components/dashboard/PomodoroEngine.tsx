import { useEffect } from 'react';
import { usePomodoroStore } from '../../stores/usePomodoroStore';

export function PomodoroEngine() {
  const tick = usePomodoroStore((s) => s.tick);
  useEffect(() => {
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);
  return null;
}
