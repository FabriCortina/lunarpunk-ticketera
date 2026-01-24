import { calculateMoonPhaseFallback } from './moonPhaseFallback';

type MoonPhaseResponse = {
  phaseName: string;
  illuminationPct: number;
  source: 'api' | 'fallback';
};

type PhaseMeta = {
  phaseName: string;
  phase01: number;
  waxing: boolean;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCacheKey = (dateStr: string) => `moonphase:${dateStr}`;

const getCachedPhase = (dateStr: string) => {
  try {
    const key = getCacheKey(dateStr);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      phaseName: string;
      illuminationPct: number;
      fetchedAt: number;
    };
    if (!parsed?.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const setCachedPhase = (dateStr: string, phaseName: string, illuminationPct: number) => {
  try {
    const key = getCacheKey(dateStr);
    const payload = { phaseName, illuminationPct, fetchedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore cache failures
  }
};

export const mapPhaseName = (phase: string): PhaseMeta => {
  const normalized = phase.trim().toLowerCase();

  if (normalized.includes('new')) {
    return { phaseName: 'New Moon', phase01: 0, waxing: false };
  }
  if (normalized.includes('full')) {
    return { phaseName: 'Full Moon', phase01: 0.5, waxing: false };
  }
  if (normalized.includes('first')) {
    return { phaseName: 'First Quarter', phase01: 0.25, waxing: true };
  }
  if (normalized.includes('last')) {
    return { phaseName: 'Last Quarter', phase01: 0.75, waxing: false };
  }
  if (normalized.includes('waxing') && normalized.includes('crescent')) {
    return { phaseName: 'Waxing Crescent', phase01: 0.125, waxing: true };
  }
  if (normalized.includes('waxing') && normalized.includes('gibbous')) {
    return { phaseName: 'Waxing Gibbous', phase01: 0.375, waxing: true };
  }
  if (normalized.includes('waning') && normalized.includes('gibbous')) {
    return { phaseName: 'Waning Gibbous', phase01: 0.625, waxing: false };
  }
  if (normalized.includes('waning') && normalized.includes('crescent')) {
    return { phaseName: 'Waning Crescent', phase01: 0.875, waxing: false };
  }

  return { phaseName: 'New Moon', phase01: 0, waxing: false };
};

export const fetchMoonPhaseByDate = async (date: Date): Promise<MoonPhaseResponse> => {
  const dateStr = formatLocalDate(date);
  const cached = getCachedPhase(dateStr);
  if (cached) {
    return { phaseName: cached.phaseName, illuminationPct: cached.illuminationPct, source: 'api' };
  }

  try {
    const response = await fetch(
      `https://api.phaseofthemoontoday.com/v1/date/${dateStr}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      throw new Error('API response not OK');
    }

    const data = await response.json();
    const phase = typeof data?.phase === 'string' ? data.phase : '';
    const illumination = Number(data?.illumination);
    if (!phase || Number.isNaN(illumination)) {
      throw new Error('Invalid API payload');
    }

    const { phaseName } = mapPhaseName(phase);
    const illuminationPct = Math.round(illumination);
    setCachedPhase(dateStr, phaseName, illuminationPct);
    return { phaseName, illuminationPct, source: 'api' };
  } catch {
    const fallback = calculateMoonPhaseFallback(date);
    setCachedPhase(dateStr, fallback.phaseName, fallback.illuminationPct);
    return {
      phaseName: fallback.phaseName,
      illuminationPct: fallback.illuminationPct,
      source: 'fallback'
    };
  }
};
