import { useState, useCallback } from 'react';
import { getConfidence, getPredictedMargin, FEEDS_INTO } from '../data/bracketData';

const ROUND_LABELS = {
  playin: 'Play-In',
  r64: 'Round of 64',
  r32: 'Round of 32',
  s16: 'Sweet 16',
  e8: 'Elite 8',
  ff: 'Final Four',
  championship: 'Championship',
};

const CONF_LABELS = {
  high: { label: 'High', color: '#3fb950' },
  medium: { label: 'Med', color: '#d29922' },
  low: { label: 'Low', color: '#f85149' },
  unknown: { label: '?', color: '#8b949e' },
};

export default function SidePanel({ games, selections, predictedRounds, resolveTeams, onClear, onSave }) {
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    onSave?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [onSave]);
  // ---- 1. Model Accuracy ----
  // Count games where selections exist AND the round's predictions are revealed
  const gamesSelected = games.filter(
    (g) => selections[g.id] && predictedRounds.has(g.round)
  );
  const gamesCorrect = gamesSelected.filter(
    (g) => g.prediction && selections[g.id] === g.prediction.winner
  );

  const totalSelected = gamesSelected.length;
  const totalCorrect = gamesCorrect.length;
  const accuracy =
    totalSelected > 0
      ? ((totalCorrect / totalSelected) * 100).toFixed(1)
      : null;

  // Show clear button if any selections exist at all
  const anySelections = games.some((g) => selections[g.id]);

  // ---- 2. Top Confident Picks ----
  const gamesWithPred = games.filter((g) => g.prediction !== null);
  const ranked = [...gamesWithPred]
    .filter((g) => g.prediction.spreadRaw !== null)
    .sort(
      (a, b) =>
        Math.abs(b.prediction.spreadRaw) - Math.abs(a.prediction.spreadRaw)
    )
    .slice(0, 10);

  // ---- 3. Next Round Predictions ----
  // Show games where both teams are known AND predictions are revealed for that round
  const nextRoundGames = getNextRoundGames(games, selections, predictedRounds, resolveTeams);

  // Check if any round is filled but not yet predicted (hint)
  const filledButNotPredicted = getFilledUnpredictedRounds(games, selections, predictedRounds, resolveTeams);

  return (
    <aside className="side-panel">
      {/* --- Accuracy --- */}
      <section className="panel-section">
        <h2 className="panel-heading">Model Accuracy</h2>
        <div className="accuracy-box">
          <div className="accuracy-fraction">
            <span className="accuracy-correct">{totalCorrect}</span>
            <span className="accuracy-sep">/</span>
            <span className="accuracy-total">{totalSelected}</span>
          </div>
          <div className="accuracy-label">games scored</div>
          {accuracy !== null && (
            <div className="accuracy-pct">{accuracy}%</div>
          )}
          {totalSelected === 0 && (
            <div className="accuracy-hint">Select winners to track accuracy</div>
          )}
        </div>
        <div className="panel-actions">
          <button
            className={`save-btn${saved ? ' save-btn-saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? '✓ Saved' : 'Save Progress'}
          </button>
          {anySelections && (
            <button className="clear-btn" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </section>

      {/* --- Top Confident Picks --- */}
      <section className="panel-section">
        <h2 className="panel-heading">Most Confident Picks</h2>
        <div className="confident-list">
          {ranked.map((g, i) => {
            const sel = selections[g.id];
            const pred = g.prediction.winner;
            let icon = '·';
            let iconCls = 'icon-pending';
            if (sel) {
              if (sel === pred) {
                icon = '✓';
                iconCls = 'icon-correct';
              } else {
                icon = '✗';
                iconCls = 'icon-wrong';
              }
            }
            const conf = getConfidence(g);
            const margin = getPredictedMargin(g);
            return (
              <div key={g.id} className="confident-item">
                <span className="ci-rank">{i + 1}</span>
                <div className="ci-info">
                  <div className="ci-matchup">
                    <span className="ci-winner">{pred}</span>
                    <span className="ci-vs">
                      {' '}vs{' '}
                      {pred === g.topTeam.name
                        ? g.botTeam.name
                        : g.topTeam.name}
                    </span>
                  </div>
                  <div className="ci-meta">
                    <span className="ci-round">{ROUND_LABELS[g.round]}</span>
                    {g.region && (
                      <span className="ci-region">{g.region}</span>
                    )}
                    <span
                      className="ci-conf"
                      style={{ color: CONF_LABELS[conf].color }}
                    >
                      {margin !== null ? `${margin.toFixed(1)} pts` : ''}
                    </span>
                  </div>
                </div>
                <span className={`ci-icon ${iconCls}`}>{icon}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- Next Round Predictions --- */}
      <section className="panel-section">
        <h2 className="panel-heading">Next Round Predictions</h2>
        {filledButNotPredicted.length > 0 && (
          <p className="panel-empty">
            {filledButNotPredicted.map((r) => ROUND_LABELS[r]).join(', ')} ready — click "Reveal" to see predictions.
          </p>
        )}
        {nextRoundGames.length === 0 && filledButNotPredicted.length === 0 ? (
          <p className="panel-empty">
            Select winners in earlier rounds to see upcoming matchups.
          </p>
        ) : nextRoundGames.length > 0 ? (
          <table className="next-round-table">
            <thead>
              <tr>
                <th>Matchup</th>
                <th>Pred Winner</th>
                <th>Margin</th>
                <th>O/U</th>
                <th>Conf</th>
              </tr>
            </thead>
            <tbody>
              {nextRoundGames.map((item) => {
                const conf = getConfidence(item.game);
                const margin = getPredictedMargin(item.game);
                const confInfo = CONF_LABELS[conf];
                return (
                  <tr key={item.game.id}>
                    <td className="nr-matchup">
                      <span className="nr-team">
                        ({item.actualTop.seed}) {item.actualTop.name}
                      </span>
                      <span className="nr-vs"> vs </span>
                      <span className="nr-team">
                        ({item.actualBot.seed}) {item.actualBot.name}
                      </span>
                    </td>
                    <td className="nr-winner">
                      {item.game.prediction
                        ? item.game.prediction.winner
                        : '—'}
                    </td>
                    <td className="nr-spread">
                      {margin !== null ? margin.toFixed(1) : '—'}
                    </td>
                    <td className="nr-total">
                      {item.game.prediction && item.game.prediction.total !== null
                        ? item.game.prediction.total.toFixed(1)
                        : '—'}
                    </td>
                    <td>
                      <span
                        className="conf-badge"
                        style={{ color: confInfo.color, borderColor: confInfo.color }}
                      >
                        {confInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </section>
    </aside>
  );
}

/**
 * Returns next-round games where both teams are determined via resolveTeams
 * AND predictions are revealed for that game's round AND the game has not yet been selected.
 */
function getNextRoundGames(games, selections, predictedRounds, resolveTeams) {
  const gameById = {};
  games.forEach((g) => (gameById[g.id] = g));

  const slotsFilled = {};

  games.forEach((g) => {
    const feed = FEEDS_INTO[g.id];
    if (!feed) return;
    const { nextGameId, slot } = feed;
    if (!slotsFilled[nextGameId]) {
      slotsFilled[nextGameId] = { top: null, bot: null };
    }

    const actualWinner = selections[g.id];
    if (!actualWinner) return;

    let winnerObj = null;
    if (actualWinner === g.topTeam.name) {
      winnerObj = { name: g.topTeam.name, seed: g.topTeam.seed };
    } else if (actualWinner === g.botTeam.name) {
      winnerObj = { name: g.botTeam.name, seed: g.botTeam.seed };
    }
    if (winnerObj) {
      slotsFilled[nextGameId][slot] = winnerObj;
    }
  });

  const results = [];
  Object.entries(slotsFilled).forEach(([nextGameId, slots]) => {
    if (slots.top && slots.bot) {
      const nextGame = gameById[nextGameId];
      if (!nextGame) return;
      // Only show if predictions are revealed for this round AND game not yet selected
      if (!selections[nextGameId] && predictedRounds.has(nextGame.round)) {
        results.push({
          game: nextGame,
          actualTop: slots.top,
          actualBot: slots.bot,
        });
      }
    }
  });

  return results;
}

/**
 * Returns rounds that are fully filled (both teams known) but predictions not yet revealed.
 */
function getFilledUnpredictedRounds(games, selections, predictedRounds, resolveTeams) {
  const ROUND_ORDER = ['r32', 's16', 'e8', 'ff', 'championship'];
  const result = [];
  for (const round of ROUND_ORDER) {
    if (predictedRounds.has(round)) continue;
    const rg = games.filter((g) => g.round === round);
    if (!rg.length) continue;
    const allFilled = rg.every((g) => {
      const { topTeam, botTeam } = resolveTeams(g);
      return topTeam !== null && botTeam !== null;
    });
    if (allFilled) result.push(round);
  }
  return result;
}
