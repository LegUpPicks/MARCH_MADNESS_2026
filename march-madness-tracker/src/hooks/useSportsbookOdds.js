import { useState, useEffect, useCallback } from 'react';
import { fetchOddsForGames } from '../services/sportsbookApi';

export function useSportsbookOdds(games) {
  const [oddsMap, setOddsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!games?.length) return;
    setLoading(true);
    setError(null);
    try {
      const odds = await fetchOddsForGames(games);
      setOddsMap(odds);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [games]);

  // Fetch once on mount
  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { oddsMap, loading, error, refresh };
}
