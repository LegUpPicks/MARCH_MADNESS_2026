import allMatchupPredictions from '../data/allMatchupPredictions.json';

const MODEL_KEYS = [
  { key: 'balanced_rounds',   label: 'Balanced Rounds',   perRound: true },
  { key: 'unbalanced_rounds', label: 'Unbalanced Rounds', perRound: true },
  { key: 'kaggle',            label: 'Kaggle' },
  { key: 'seeded',            label: 'With Seeds' },
  { key: 'noSeed',            label: 'No Seeds' },
];

const ROUND_INT = { playin: 0, r64: 1, r32: 2, s16: 3, e8: 4, ff: 5, championship: 6 };
const ROUND_LABELS = {
  playin: 'Play-In', r64: 'R64', r32: 'R32',
  s16: 'S16', e8: 'E8', ff: 'FF', championship: 'Champ',
};

function AccBadge({ pct }) {
  if (pct == null) return <span className="mp-na">—</span>;
  const color = pct >= 75 ? '#3fb950' : pct >= 60 ? '#f59e0b' : '#f85149';
  return <span className="mp-acc-badge" style={{ color }}>{pct.toFixed(1)}%</span>;
}

export default function ModelPerformanceModal({ games, oddsMap, gender, onClose }) {
  const prefix = gender === 'womens' ? 'w' : 'm';

  const completedGames = games
    .filter(g => oddsMap?.[g.id]?.completedWinner)
    .map(g => {
      const result = oddsMap[g.id];
      const topName = g.topTeam?.name?.replace(/\*$/, '');
      const botName = g.botTeam?.name?.replace(/\*$/, '');
      if (!topName || !botName) return null;

      const [a, b] = [topName, botName].sort();
      const entry = allMatchupPredictions[`${prefix}:${a}|${b}`];
      const roundIdx = ROUND_INT[g.round] ?? 1;

      const mp = {
        seeded:            entry?.seeded                              ?? null,
        noSeed:            entry?.noSeed                             ?? null,
        unbalanced_rounds: entry?.unbalanced_rounds?.[String(roundIdx)] ?? null,
        balanced_rounds:   entry?.balanced_rounds?.[String(roundIdx)]   ?? null,
        kaggle:            entry?.kaggle                             ?? null,
      };

      return {
        topName,
        botName,
        round:        g.round,
        winner:       result.completedWinner,
        actualSpread: result.actualSpread ?? null,
        actualTotal:  result.actualTotal  ?? null,
        scores:       result.scores       ?? null,
        mp,
      };
    })
    .filter(Boolean);

  // Per-model aggregate stats
  const stats = MODEL_KEYS.map(({ key, label }) => {
    let wins = 0, losses = 0;
    const spreadErrors = [], totalErrors = [];

    for (const game of completedGames) {
      const pred = game.mp[key];
      if (!pred) continue;
      if (pred.predWinner === game.winner) wins++; else losses++;
      if (pred.spread != null && game.actualSpread != null)
        spreadErrors.push(Math.abs(Math.abs(pred.spread) - game.actualSpread));
      if (pred.total != null && game.actualTotal != null)
        totalErrors.push(Math.abs(pred.total - game.actualTotal));
    }

    const total = wins + losses;
    return {
      label,
      wins,
      losses,
      total,
      winPct:    total > 0 ? (wins / total) * 100 : null,
      spreadMae: spreadErrors.length ? spreadErrors.reduce((s, v) => s + v, 0) / spreadErrors.length : null,
      totalMae:  totalErrors.length  ? totalErrors.reduce((s, v) => s + v, 0)  / totalErrors.length  : null,
    };
  });

  return (
    <div className="mp-overlay" onClick={onClose}>
      <div className="mp-modal" onClick={e => e.stopPropagation()}>

        <div className="mp-modal-header">
          <span className="mp-title">
            Model Performance — 2026 Tournament
            <span className="mp-subtitle"> · {completedGames.length} game{completedGames.length !== 1 ? 's' : ''} completed</span>
          </span>
          <button className="betslip-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mp-modal-body">
          {completedGames.length === 0 ? (
            <p className="mp-empty">No completed games found yet. Refresh odds to pick up results.</p>
          ) : (
            <>
              {/* Summary table */}
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Record</th>
                      <th>Win %</th>
                      <th>Spread MAE</th>
                      <th>Total MAE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(s => (
                      <tr key={s.label}>
                        <td className="mp-model-name">{s.label}</td>
                        <td className="mp-wl">{s.total > 0 ? `${s.wins}–${s.losses}` : '—'}</td>
                        <td className="mp-pct"><AccBadge pct={s.winPct} /></td>
                        <td className="mp-mae">{s.spreadMae != null ? `${s.spreadMae.toFixed(2)} pts` : '—'}</td>
                        <td className="mp-mae">{s.totalMae  != null ? `${s.totalMae.toFixed(2)} pts`  : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Game-by-game log */}
              <h3 className="mp-log-title">Game Log</h3>
              <div className="mp-table-wrap">
                <table className="mp-table mp-log-table">
                  <thead>
                    <tr>
                      <th>Rd</th>
                      <th>Matchup</th>
                      <th>Actual</th>
                      {MODEL_KEYS.map(m => <th key={m.key}>{m.label.split(' ')[0]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {completedGames.map((game, i) => {
                      const scoreStr = game.scores
                        ? `${game.winner} wins · ${Object.values(game.scores).sort((a,b) => b - a).join('–')}`
                        : game.winner;
                      return (
                        <tr key={i}>
                          <td className="mp-round">{ROUND_LABELS[game.round] ?? game.round}</td>
                          <td className="mp-matchup">{game.topName} vs {game.botName}</td>
                          <td className="mp-actual">{scoreStr}</td>
                          {MODEL_KEYS.map(({ key }) => {
                            const pred = game.mp[key];
                            if (!pred) return <td key={key} className="mp-na">—</td>;
                            const correct = pred.predWinner === game.winner;
                            return (
                              <td key={key} className={`mp-pick ${correct ? 'mp-correct' : 'mp-wrong'}`}>
                                {correct ? '✓' : '✗'} {pred.predWinner}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
