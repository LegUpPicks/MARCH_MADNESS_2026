import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
  mens: 'mm2026-mens-selections',
  womens: 'mm2026-womens-selections',
};

export function useSelections(gender) {
  const storageKey = STORAGE_KEYS[gender] || STORAGE_KEYS.mens;

  const [selections, setSelections] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Reload from localStorage when gender changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setSelections(raw ? JSON.parse(raw) : {});
    } catch {
      setSelections({});
    }
  }, [storageKey]);

  // Persist whenever selections change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(selections));
    } catch {
      // Ignore storage errors
    }
  }, [selections, storageKey]);

  /**
   * Set or toggle the actual winner for a game.
   * If teamName matches the current selection, deselect (toggle off).
   */
  function setWinner(gameId, teamName) {
    setSelections((prev) => {
      if (prev[gameId] === teamName) {
        // Toggle off
        const next = { ...prev };
        delete next[gameId];
        return next;
      }
      return { ...prev, [gameId]: teamName };
    });
  }

  function clearSelections() {
    setSelections({});
  }

  return [selections, setWinner, clearSelections];
}
