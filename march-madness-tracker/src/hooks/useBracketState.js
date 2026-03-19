import { useState, useEffect, useCallback, useMemo } from 'react';
import { mensGames, womensGames, FEEDS_INTO, FEEDS_FROM } from '../data/bracketData';

// For an R64 game with a playinSlot, resolve the play-in team (marked with *)
// to the actual winner selected in the play-in game.
function resolvePlayinTeamForSlot(r64Game, slotTeam, gameById, selections) {
  if (!r64Game.playinSlot || !slotTeam?.name?.endsWith('*')) return slotTeam;
  const playinGame = Object.values(gameById).find(
    g => g.round === 'playin' && g.playinSlot === r64Game.playinSlot
  );
  if (!playinGame) return slotTeam;
  const sel = selections[playinGame.id];
  if (!sel) return slotTeam; // not picked yet — keep * placeholder
  return sel === playinGame.topTeam.name ? playinGame.topTeam : playinGame.botTeam;
}

// Recursively resolve the actual current team that won a given game,
// following promotions all the way down the chain rather than trusting
// static topTeam/botTeam names (which only match the original predictions).
function resolveActualTeam(gameId, slot, gameById, selections) {
  const fromId = FEEDS_FROM[gameId]?.[slot];
  if (!fromId) return null;
  const fromGame = gameById[fromId];
  if (!fromGame) return null;
  const winner = selections[fromId];
  if (!winner) return null;

  let topTeam, botTeam;
  if (fromGame.round === 'playin') {
    topTeam = fromGame.topTeam;
    botTeam = fromGame.botTeam;
  } else if (fromGame.round === 'r64') {
    topTeam = resolvePlayinTeamForSlot(fromGame, fromGame.topTeam, gameById, selections);
    botTeam = resolvePlayinTeamForSlot(fromGame, fromGame.botTeam, gameById, selections);
  } else {
    topTeam = resolveActualTeam(fromId, 'top', gameById, selections);
    botTeam = resolveActualTeam(fromId, 'bot', gameById, selections);
  }

  if (winner === topTeam?.name) return topTeam;
  if (winner === botTeam?.name) return botTeam;
  return null;
}

export const ROUND_ORDER = ['playin', 'r64', 'r32', 's16', 'e8', 'ff', 'championship'];

export const ROUND_LABELS = {
  playin: 'Play-In',
  r64: 'Round of 64',
  r32: 'Round of 32',
  s16: 'Sweet 16',
  e8: 'Elite 8',
  ff: 'Final Four',
  championship: 'Championship',
};

function getInitialSelections() {
  return {};
}

function cascadeClear(changedId, selections) {
  const result = { ...selections };
  const queue = [changedId];
  const visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const feed = FEEDS_INTO[id];
    if (feed) {
      const { nextGameId } = feed;
      if (result[nextGameId] !== undefined) {
        delete result[nextGameId];
        queue.push(nextGameId);
      }
    }
  }
  return result;
}

export function useBracketState(gender) {
  const games = useMemo(() => (gender === 'mens' ? mensGames : womensGames), [gender]);
  const storageKey = `mm2026_v4_${gender}`;

  const gameById = useMemo(
    () => Object.fromEntries(games.map((g) => [g.id, g])),
    [games]
  );

  const [selections, setSelections] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return s?.selections ?? getInitialSelections();
    } catch {
      return getInitialSelections(games);
    }
  });

  const [predictedRounds, setPredictedRounds] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return new Set(s?.predictedRounds ?? []);
    } catch {
      return new Set(['playin', 'r64']);
    }
  });

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(storageKey) || 'null');
      setSelections(s?.selections ?? getInitialSelections());
      setPredictedRounds(new Set(s?.predictedRounds ?? []));
    } catch {
      setSelections(getInitialSelections(games));
      setPredictedRounds(new Set(['playin', 'r64']));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ selections, predictedRounds: [...predictedRounds] })
      );
    } catch { /* ignore */ }
  }, [selections, predictedRounds, storageKey]);

  const getPromotedTeam = useCallback(
    (gameId, slot) => resolveActualTeam(gameId, slot, gameById, selections),
    [gameById, selections]
  );

  const resolveTeams = useCallback(
    (game) => {
      if (game.round === 'playin') {
        return { topTeam: game.topTeam, botTeam: game.botTeam };
      }
      if (game.round === 'r64') {
        return {
          topTeam: resolvePlayinTeamForSlot(game, game.topTeam, gameById, selections),
          botTeam: resolvePlayinTeamForSlot(game, game.botTeam, gameById, selections),
        };
      }
      return {
        topTeam: getPromotedTeam(game.id, 'top'),
        botTeam: getPromotedTeam(game.id, 'bot'),
      };
    },
    [gameById, selections, getPromotedTeam]
  );

  const isRoundFilled = useCallback(
    (round) => {
      const rg = games.filter((g) => g.round === round);
      if (!rg.length) return false;
      return rg.every((g) => {
        const { topTeam, botTeam } = resolveTeams(g);
        return topTeam !== null && botTeam !== null;
      });
    },
    [games, resolveTeams]
  );

  const nextPredictableRound = useMemo(() => {
    for (const round of ROUND_ORDER) {
      if (!predictedRounds.has(round) && isRoundFilled(round)) return round;
    }
    return null;
  }, [predictedRounds, isRoundFilled]);

  const predictRound = useCallback((round) => {
    setPredictedRounds((prev) => new Set([...prev, round]));
  }, []);

  const setWinner = useCallback((gameId, teamName) => {
    setSelections((prev) => {
      if (prev[gameId] === teamName) return prev; // already set — no-op
      const next = cascadeClear(gameId, { ...prev });
      next[gameId] = teamName;
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelections(getInitialSelections());
    setPredictedRounds(new Set([]));
  }, [games]);

  const save = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ selections, predictedRounds: [...predictedRounds] })
      );
    } catch { /* ignore */ }
  }, [storageKey, selections, predictedRounds]);

  return {
    games,
    selections,
    predictedRounds,
    resolveTeams,
    nextPredictableRound,
    predictRound,
    setWinner,
    clearAll,
    save,
    gameById,
  };
}
