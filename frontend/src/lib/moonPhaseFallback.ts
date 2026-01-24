type MoonPhaseFallback = {
  phaseName: string;
  illuminationPct: number;
  phase01: number;
  waxing: boolean;
};

const SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0);

const getPhaseNameFromPhase01 = (phase01: number, waxing: boolean) => {
  if (phase01 < 0.03 || phase01 > 0.97) return 'New Moon';
  if (phase01 >= 0.22 && phase01 <= 0.28) return 'First Quarter';
  if (phase01 >= 0.47 && phase01 <= 0.53) return 'Full Moon';
  if (phase01 >= 0.72 && phase01 <= 0.78) return 'Last Quarter';
  if (phase01 < 0.25) return waxing ? 'Waxing Crescent' : 'Waning Crescent';
  if (phase01 < 0.5) return waxing ? 'Waxing Gibbous' : 'Waning Gibbous';
  if (phase01 < 0.75) return waxing ? 'Waxing Gibbous' : 'Waning Gibbous';
  return waxing ? 'Waxing Crescent' : 'Waning Crescent';
};

export const calculateMoonPhaseFallback = (date: Date): MoonPhaseFallback => {
  const daysSinceReference =
    (date.getTime() - REFERENCE_NEW_MOON_UTC) / (1000 * 60 * 60 * 24);
  let phase01 = (daysSinceReference % SYNODIC_MONTH_DAYS) / SYNODIC_MONTH_DAYS;
  if (phase01 < 0) phase01 += 1;

  const illumination =
    (1 - Math.cos(2 * Math.PI * phase01)) / 2;
  const illuminationPct = Math.round(illumination * 100);
  const waxing = phase01 < 0.5;
  const phaseName = getPhaseNameFromPhase01(phase01, waxing);

  return { phaseName, illuminationPct, phase01, waxing };
};
