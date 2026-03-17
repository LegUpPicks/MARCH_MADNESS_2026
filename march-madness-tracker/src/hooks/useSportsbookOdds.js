import { useState, useCallback } from 'react';
import { fetchOddsForGames } from '../services/sportsbookApi';

const storageKey = (gender) => `mm2026-odds-${gender}`;

function loadCached(gender) {
  try {
    const raw = localStorage.getItem(storageKey(gender));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCached(gender, oddsMap) {
  try {
    localStorage.setItem(storageKey(gender), JSON.stringify(oddsMap));
  } catch {}
}

export function useSportsbookOdds(games, gender = 'mens') {
  const [oddsMap, setOddsMap] = useState(() => loadCached(gender));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!games?.length) return;
    setLoading(true);
    setError(null);
    try {
      const odds = await fetchOddsForGames(games, gender);
      setOddsMap(odds);
      saveCached(gender, odds);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [games, gender]);

  return { oddsMap, loading, error, refresh };
}
