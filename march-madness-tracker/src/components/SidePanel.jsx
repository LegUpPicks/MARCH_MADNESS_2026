import { getConfidence, getPredictedMargin } from '../data/bracketData';

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

export default function SidePanel({ games, selections, onClear }) {
  // ---- 1. Model Accuracy ----
  const gamesWithPred = games.filter((g) => g.prediction !== null);
  const gamesSelected = games.filter((g) => selections[g.id]);
  const gamesCorrect = gamesSelected.filter(
    (g) => g.prediction && selections[g.id] === g.prediction.winner
  );

  const totalSelected = gamesSelected.length;
  const totalCorrect = gamesCorrect.length;
  const accuracy =
    totalSelected > 0
      ? ((totalCorrect / totalSelected) * 100).toFixed(1)
      : null;

  // ---- 2. Top Confident Picks ----
  const ranked = [...gamesWithPred]
    .filter((g) => g.prediction.spreadRaw !== null)
    .sort(
      (a, b) =>
        Math.abs(b.prediction.spreadRaw) - Math.abs(a.prediction.spreadRaw)
    )
    .slice(0, 10);

  // ---- 3. Next Round Predictions ----
  // For each game where BOTH teams are now determined by actual selections,
  // find the corresponding "next round" game in the bracket.
  // We compute which teams have been "sent forward" to the next round
  // by using actual selections (falling back to predicted winners for unplayed games).
  // Here we only show games where BOTH participants are known from actual selections.
  const nextRoundGames = getNextRoundGames(games, selections);

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
            <div className="accuracy-hint">Click teams to record results</div>
          )}
        </div>
        {totalSelected > 0 && (
          <button className="clear-btn" onClick={onClear}>
            Clear All Selections
          </button>
        )}
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
        {nextRoundGames.length === 0 ? (
          <p className="panel-empty">
            Select winners in earlier rounds to see upcoming matchups.
          </p>
        ) : (
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
        )}
      </section>
    </aside>
  );
}

// ============================================================
// Logic: find "next round" games where both teams are determined
// by actual selections from the previous round.
// ============================================================

// Maps each r64 game to the r32 game it feeds into, etc.
// We do this by the game ID naming convention.

// The bracket feed-forward mapping by game ID:
// For each round, we know which two games feed into the next.
// This is encoded as: feedsInto[gameId] = { nextGameId, slot: 'top' | 'bot' }

const FEEDS_INTO = buildFeedsInto();

function buildFeedsInto() {
  const map = {};

  // Men's W region
  // r64 -> r32
  mapFeed(map, 'M_W_R64_1v16', 'M_W_R32_1v9', 'top');
  mapFeed(map, 'M_W_R64_8v9', 'M_W_R32_1v9', 'bot');
  mapFeed(map, 'M_W_R64_5v12', 'M_W_R32_4v5', 'bot');
  mapFeed(map, 'M_W_R64_4v13', 'M_W_R32_4v5', 'top');
  mapFeed(map, 'M_W_R64_6v11', 'M_W_R32_3v6', 'bot');
  mapFeed(map, 'M_W_R64_3v14', 'M_W_R32_3v6', 'top');
  mapFeed(map, 'M_W_R64_7v10', 'M_W_R32_2v7', 'bot');
  mapFeed(map, 'M_W_R64_2v15', 'M_W_R32_2v7', 'top');
  // r32 -> s16
  mapFeed(map, 'M_W_R32_1v9', 'M_W_S16_1v4', 'top');
  mapFeed(map, 'M_W_R32_4v5', 'M_W_S16_1v4', 'bot');
  mapFeed(map, 'M_W_R32_3v6', 'M_W_S16_3v2', 'top');
  mapFeed(map, 'M_W_R32_2v7', 'M_W_S16_3v2', 'bot');
  // s16 -> e8
  mapFeed(map, 'M_W_S16_1v4', 'M_W_E8', 'top');
  mapFeed(map, 'M_W_S16_3v2', 'M_W_E8', 'bot');
  // e8 -> ff
  mapFeed(map, 'M_W_E8', 'M_FF_WX', 'top');

  // Men's X region
  mapFeed(map, 'M_X_R64_1v16', 'M_X_R32_1v8', 'top');
  mapFeed(map, 'M_X_R64_8v9', 'M_X_R32_1v8', 'bot');
  mapFeed(map, 'M_X_R64_5v12', 'M_X_R32_4v5', 'bot');
  mapFeed(map, 'M_X_R64_4v13', 'M_X_R32_4v5', 'top');
  mapFeed(map, 'M_X_R64_6v11', 'M_X_R32_3v6', 'bot');
  mapFeed(map, 'M_X_R64_3v14', 'M_X_R32_3v6', 'top');
  mapFeed(map, 'M_X_R64_7v10', 'M_X_R32_2v7', 'bot');
  mapFeed(map, 'M_X_R64_2v15', 'M_X_R32_2v7', 'top');
  mapFeed(map, 'M_X_R32_1v8', 'M_X_S16_1v4', 'top');
  mapFeed(map, 'M_X_R32_4v5', 'M_X_S16_1v4', 'bot');
  mapFeed(map, 'M_X_R32_3v6', 'M_X_S16_3v2', 'top');
  mapFeed(map, 'M_X_R32_2v7', 'M_X_S16_3v2', 'bot');
  mapFeed(map, 'M_X_S16_1v4', 'M_X_E8', 'top');
  mapFeed(map, 'M_X_S16_3v2', 'M_X_E8', 'bot');
  mapFeed(map, 'M_X_E8', 'M_FF_WX', 'bot');

  // Men's Y region
  mapFeed(map, 'M_Y_R64_1v16', 'M_Y_R32_1v8', 'top');
  mapFeed(map, 'M_Y_R64_8v9', 'M_Y_R32_1v8', 'bot');
  mapFeed(map, 'M_Y_R64_5v12', 'M_Y_R32_4v5', 'bot');
  mapFeed(map, 'M_Y_R64_4v13', 'M_Y_R32_4v5', 'top');
  mapFeed(map, 'M_Y_R64_6v11', 'M_Y_R32_3v6', 'bot');
  mapFeed(map, 'M_Y_R64_3v14', 'M_Y_R32_3v6', 'top');
  mapFeed(map, 'M_Y_R64_7v10', 'M_Y_R32_2v7', 'bot');
  mapFeed(map, 'M_Y_R64_2v15', 'M_Y_R32_2v7', 'top');
  mapFeed(map, 'M_Y_R32_1v8', 'M_Y_S16_1v5', 'top');
  mapFeed(map, 'M_Y_R32_4v5', 'M_Y_S16_1v5', 'bot');
  mapFeed(map, 'M_Y_R32_3v6', 'M_Y_S16_3v2', 'top');
  mapFeed(map, 'M_Y_R32_2v7', 'M_Y_S16_3v2', 'bot');
  mapFeed(map, 'M_Y_S16_1v5', 'M_Y_E8', 'top');
  mapFeed(map, 'M_Y_S16_3v2', 'M_Y_E8', 'bot');
  mapFeed(map, 'M_Y_E8', 'M_FF_YZ', 'top');

  // Men's Z region
  mapFeed(map, 'M_Z_R64_1v16', 'M_Z_R32_1v8', 'top');
  mapFeed(map, 'M_Z_R64_8v9', 'M_Z_R32_1v8', 'bot');
  mapFeed(map, 'M_Z_R64_5v12', 'M_Z_R32_4v5', 'bot');
  mapFeed(map, 'M_Z_R64_4v13', 'M_Z_R32_4v5', 'top');
  mapFeed(map, 'M_Z_R64_6v11', 'M_Z_R32_3v6', 'bot');
  mapFeed(map, 'M_Z_R64_3v14', 'M_Z_R32_3v6', 'top');
  mapFeed(map, 'M_Z_R64_7v10', 'M_Z_R32_2v7', 'bot');
  mapFeed(map, 'M_Z_R64_2v15', 'M_Z_R32_2v7', 'top');
  mapFeed(map, 'M_Z_R32_1v8', 'M_Z_S16_1v4', 'top');
  mapFeed(map, 'M_Z_R32_4v5', 'M_Z_S16_1v4', 'bot');
  mapFeed(map, 'M_Z_R32_3v6', 'M_Z_S16_3v2', 'top');
  mapFeed(map, 'M_Z_R32_2v7', 'M_Z_S16_3v2', 'bot');
  mapFeed(map, 'M_Z_S16_1v4', 'M_Z_E8', 'top');
  mapFeed(map, 'M_Z_S16_3v2', 'M_Z_E8', 'bot');
  mapFeed(map, 'M_Z_E8', 'M_FF_YZ', 'bot');

  // Men's FF -> Championship
  mapFeed(map, 'M_FF_WX', 'M_CHAMP', 'top');
  mapFeed(map, 'M_FF_YZ', 'M_CHAMP', 'bot');

  // Women's W region
  mapFeed(map, 'W_W_R64_1v16', 'W_W_R32_1v9', 'top');
  mapFeed(map, 'W_W_R64_8v9', 'W_W_R32_1v9', 'bot');
  mapFeed(map, 'W_W_R64_5v12', 'W_W_R32_4v5', 'bot');
  mapFeed(map, 'W_W_R64_4v13', 'W_W_R32_4v5', 'top');
  mapFeed(map, 'W_W_R64_6v11', 'W_W_R32_3v11', 'bot');
  mapFeed(map, 'W_W_R64_3v14', 'W_W_R32_3v11', 'top');
  mapFeed(map, 'W_W_R64_7v10', 'W_W_R32_2v7', 'bot');
  mapFeed(map, 'W_W_R64_2v15', 'W_W_R32_2v7', 'top');
  mapFeed(map, 'W_W_R32_1v9', 'W_W_S16_1v4', 'top');
  mapFeed(map, 'W_W_R32_4v5', 'W_W_S16_1v4', 'bot');
  mapFeed(map, 'W_W_R32_3v11', 'W_W_S16_2v11', 'top');
  mapFeed(map, 'W_W_R32_2v7', 'W_W_S16_2v11', 'bot');
  mapFeed(map, 'W_W_S16_1v4', 'W_W_E8', 'top');
  mapFeed(map, 'W_W_S16_2v11', 'W_W_E8', 'bot');
  mapFeed(map, 'W_W_E8', 'W_FF_WX', 'top');

  // Women's X region
  mapFeed(map, 'W_X_R64_1v16', 'W_X_R32_1v9', 'top');
  mapFeed(map, 'W_X_R64_8v9', 'W_X_R32_1v9', 'bot');
  mapFeed(map, 'W_X_R64_5v12', 'W_X_R32_4v5', 'bot');
  mapFeed(map, 'W_X_R64_4v13', 'W_X_R32_4v5', 'top');
  mapFeed(map, 'W_X_R64_6v11', 'W_X_R32_3v6', 'bot');
  mapFeed(map, 'W_X_R64_3v14', 'W_X_R32_3v6', 'top');
  mapFeed(map, 'W_X_R64_7v10', 'W_X_R32_2v7', 'bot');
  mapFeed(map, 'W_X_R64_2v15', 'W_X_R32_2v7', 'top');
  mapFeed(map, 'W_X_R32_1v9', 'W_X_S16_1v5', 'top');
  mapFeed(map, 'W_X_R32_4v5', 'W_X_S16_1v5', 'bot');
  mapFeed(map, 'W_X_R32_3v6', 'W_X_S16_6v7', 'top');
  mapFeed(map, 'W_X_R32_2v7', 'W_X_S16_6v7', 'bot');
  mapFeed(map, 'W_X_S16_1v5', 'W_X_E8', 'top');
  mapFeed(map, 'W_X_S16_6v7', 'W_X_E8', 'bot');
  mapFeed(map, 'W_X_E8', 'W_FF_WX', 'bot');

  // Women's Y region
  mapFeed(map, 'W_Y_R64_1v16', 'W_Y_R32_1v8', 'top');
  mapFeed(map, 'W_Y_R64_8v9', 'W_Y_R32_1v8', 'bot');
  mapFeed(map, 'W_Y_R64_5v12', 'W_Y_R32_4v5', 'bot');
  mapFeed(map, 'W_Y_R64_4v13', 'W_Y_R32_4v5', 'top');
  mapFeed(map, 'W_Y_R64_6v11', 'W_Y_R32_3v6', 'bot');
  mapFeed(map, 'W_Y_R64_3v14', 'W_Y_R32_3v6', 'top');
  mapFeed(map, 'W_Y_R64_7v10', 'W_Y_R32_2v10', 'bot');
  mapFeed(map, 'W_Y_R64_2v15', 'W_Y_R32_2v10', 'top');
  mapFeed(map, 'W_Y_R32_1v8', 'W_Y_S16_1v4', 'top');
  mapFeed(map, 'W_Y_R32_4v5', 'W_Y_S16_1v4', 'bot');
  mapFeed(map, 'W_Y_R32_3v6', 'W_Y_S16_3v2', 'top');
  mapFeed(map, 'W_Y_R32_2v10', 'W_Y_S16_3v2', 'bot');
  mapFeed(map, 'W_Y_S16_1v4', 'W_Y_E8', 'top');
  mapFeed(map, 'W_Y_S16_3v2', 'W_Y_E8', 'bot');
  mapFeed(map, 'W_Y_E8', 'W_FF_YZ', 'top');

  // Women's Z region
  mapFeed(map, 'W_Z_R64_1v16', 'W_Z_R32_1v8', 'top');
  mapFeed(map, 'W_Z_R64_8v9', 'W_Z_R32_1v8', 'bot');
  mapFeed(map, 'W_Z_R64_5v12', 'W_Z_R32_4v5', 'bot');
  mapFeed(map, 'W_Z_R64_4v13', 'W_Z_R32_4v5', 'top');
  mapFeed(map, 'W_Z_R64_6v11', 'W_Z_R32_3v6', 'bot');
  mapFeed(map, 'W_Z_R64_3v14', 'W_Z_R32_3v6', 'top');
  mapFeed(map, 'W_Z_R64_7v10', 'W_Z_R32_2v7', 'bot');
  mapFeed(map, 'W_Z_R64_2v15', 'W_Z_R32_2v7', 'top');
  mapFeed(map, 'W_Z_R32_1v8', 'W_Z_S16_1v5', 'top');
  mapFeed(map, 'W_Z_R32_4v5', 'W_Z_S16_1v5', 'bot');
  mapFeed(map, 'W_Z_R32_3v6', 'W_Z_S16_3v2', 'top');
  mapFeed(map, 'W_Z_R32_2v7', 'W_Z_S16_3v2', 'bot');
  mapFeed(map, 'W_Z_S16_1v5', 'W_Z_E8', 'top');
  mapFeed(map, 'W_Z_S16_3v2', 'W_Z_E8', 'bot');
  mapFeed(map, 'W_Z_E8', 'W_FF_YZ', 'bot');

  // Women's FF -> Championship
  mapFeed(map, 'W_FF_WX', 'W_CHAMP', 'top');
  mapFeed(map, 'W_FF_YZ', 'W_CHAMP', 'bot');

  return map;
}

function mapFeed(map, fromId, toId, slot) {
  map[fromId] = { nextGameId: toId, slot };
}

/**
 * Returns a list of next-round games where BOTH participants
 * have been determined by actual selections.
 */
function getNextRoundGames(games, selections) {
  const gameById = {};
  games.forEach((g) => (gameById[g.id] = g));

  // For each game, compute the "actual winner" (selection) or null if not yet selected
  // We find next-round games where BOTH feeding games have actual selections

  // Build: for each nextGameId, track which slots have been filled by selections
  const slotsFilled = {}; // { nextGameId: { top: teamObj | null, bot: teamObj | null } }

  games.forEach((g) => {
    const feed = FEEDS_INTO[g.id];
    if (!feed) return;
    const { nextGameId, slot } = feed;
    if (!slotsFilled[nextGameId]) {
      slotsFilled[nextGameId] = { top: null, bot: null };
    }

    const actualWinner = selections[g.id];
    if (!actualWinner) return; // not yet selected

    // Determine seed of winner
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

  // Now find next-round games where BOTH top and bot have been filled by actual selections
  const results = [];
  Object.entries(slotsFilled).forEach(([nextGameId, slots]) => {
    if (slots.top && slots.bot) {
      const nextGame = gameById[nextGameId];
      if (!nextGame) return;
      // Only show if that game has NOT yet been selected itself
      // (so we don't show games already decided)
      if (!selections[nextGameId]) {
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
