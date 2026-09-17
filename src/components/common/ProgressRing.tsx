export function ProgressRing({ percent, size = 40, stroke = 3.5 }: { percent: number; size?: number; stroke?: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <svg className="-rotate-90" width={size} height={size} viewBox="0 0 36 36">
      <path
        className="text-border"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <path
        className="text-primary"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeDasharray={`${clamped}, 100`}
        strokeLinecap="round"
        strokeWidth={stroke}
      />
    </svg>
  );
}
