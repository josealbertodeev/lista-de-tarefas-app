import { useEffect, useState } from 'react';
import { useTaskStore } from '../../stores/useTaskStore';

const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'];

export function Confetti() {
  const lastCompletedTaskId = useTaskStore((s) => s.lastCompletedTaskId);
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    if (!lastCompletedTaskId) return;
    const newPieces = Array.from({ length: 24 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.3,
    }));
    setPieces(newPieces);
    const timeout = setTimeout(() => setPieces([]), 1200);
    return () => clearTimeout(timeout);
  }, [lastCompletedTaskId]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute top-1/3 w-2 h-2 rounded-sm"
          style={{ left: `${p.left}%`, backgroundColor: p.color, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}
