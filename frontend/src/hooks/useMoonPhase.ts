import { useEffect, useState } from 'react';
import { calculateMoonPhaseFallback } from '../lib/moonPhaseFallback';
import { fetchMoonPhaseByDate, mapPhaseName } from '../lib/moonPhaseApi';
import { getLocalDateKey } from '../lib/dateKey';

type MoonPhaseState = {
  phaseName: string;
  illuminationPct: number;
  phase01: number;
  waxing: boolean;
  loading: boolean;
  error: string | null;
  source: 'api' | 'fallback';
};

export const useMoonPhase = (): MoonPhaseState => {
  const [currentDateKey, setCurrentDateKey] = useState(() =>
    getLocalDateKey(new Date())
  );
  const [state, setState] = useState<MoonPhaseState>({
    phaseName: 'New Moon',
    illuminationPct: 0,
    phase01: 0,
    waxing: false,
    loading: true,
    error: null,
    source: 'api'
  });

  useEffect(() => {
    let timeoutId: number | undefined;

    const load = async (date: Date) => {
      try {
        const response = await fetchMoonPhaseByDate(date);
        if (response.source === 'fallback') {
          const fallback = calculateMoonPhaseFallback(date);
          setState({
            phaseName: fallback.phaseName,
            illuminationPct: fallback.illuminationPct,
            phase01: fallback.phase01,
            waxing: fallback.waxing,
            loading: false,
            error: null,
            source: 'fallback'
          });
          return;
        }

        const meta = mapPhaseName(response.phaseName);
        setState({
          phaseName: meta.phaseName,
          illuminationPct: response.illuminationPct,
          phase01: meta.phase01,
          waxing: meta.waxing,
          loading: false,
          error: null,
          source: response.source
        });
      } catch (error: any) {
        const fallback = calculateMoonPhaseFallback(date);
        setState({
          phaseName: fallback.phaseName,
          illuminationPct: fallback.illuminationPct,
          phase01: fallback.phase01,
          waxing: fallback.waxing,
          loading: false,
          error: error?.message || 'No se pudo obtener la fase lunar.',
          source: 'fallback'
        });
      }
    };

    const scheduleNextRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      const msToMidnight = nextMidnight.getTime() - now.getTime();
      timeoutId = window.setTimeout(() => {
        const nextKey = getLocalDateKey(new Date());
        setCurrentDateKey((prev) => (prev !== nextKey ? nextKey : prev));
      }, msToMidnight + 50);
    };

    load(new Date());
    scheduleNextRefresh();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentDateKey]);

  return state;
};
