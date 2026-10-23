import { useEffect } from 'react';
import { sound } from '../utils/audio';
import { Badge } from './ui/badge';
import { Infinity as InfinityIcon } from 'lucide-react';

export default function Timer({ timeLeft, maxTime }) {
  const isUntimed = maxTime <= 0;

  useEffect(() => {
    if (!isUntimed && timeLeft <= 5 && timeLeft > 0) {
      sound.playTick();
    }
  }, [timeLeft, isUntimed]);

  if (isUntimed) {
    return (
      <Badge variant="outline" className="gap-1 px-3 py-1.5 text-xs font-mono font-semibold">
        <InfinityIcon className="w-3.5 h-3.5 text-muted-foreground" /> Untimed
      </Badge>
    );
  }

  const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const isLow = timeLeft <= 10;
  const isUrgent = timeLeft <= 5;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
        <circle
          cx="34"
          cy="34"
          r={radius}
          className="fill-none stroke-secondary"
          strokeWidth="5"
        />
        <circle
          cx="34"
          cy="34"
          r={radius}
          className={`fill-none transition-all duration-300 ${
            isUrgent
              ? 'stroke-red-600'
              : isLow
              ? 'stroke-amber-600'
              : 'stroke-foreground'
          }`}
          strokeWidth="5"
          strokeLinecap="round"
          style={{
            strokeDasharray: `${circumference}`,
            strokeDashoffset: `${circumference * (1 - percentage / 100)}`
          }}
        />
      </svg>
      <div
        className={`absolute font-mono font-bold text-sm ${
          isUrgent ? 'text-red-600 scale-105 font-black' : isLow ? 'text-amber-600' : 'text-foreground'
        }`}
      >
        {timeLeft}
      </div>
    </div>
  );
}
