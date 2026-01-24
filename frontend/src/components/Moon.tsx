import React from 'react';
import { useMoonPhase } from '../hooks/useMoonPhase';

type MoonProps = {
  size?: number;
};

export const Moon: React.FC<MoonProps> = ({ size = 96 }) => {
  const { phaseName, illuminationPct, phase01, waxing } = useMoonPhase();
  const radius = size / 2;
  const illumination = Math.min(Math.max(illuminationPct / 100, 0), 1);
  const offset = (waxing ? -1 : 1) * 2 * radius * illumination;
  const label = `${phaseName} · ${illuminationPct}%`;
  const glowSize = Math.round(size * 0.18);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      title={label}
      aria-label={label}
    >
      <div
        className="absolute inset-0 rounded-full bg-[#0b0d17]"
        style={{ boxShadow: `0 0 ${glowSize}px rgba(255, 244, 225, 0.35)` }}
      />
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute inset-0 rounded-full bg-[#f9f7f1]" />
        <div
          className="absolute inset-0 rounded-full bg-[#0b0d17]"
          style={{ transform: `translateX(${offset}px)` }}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};
