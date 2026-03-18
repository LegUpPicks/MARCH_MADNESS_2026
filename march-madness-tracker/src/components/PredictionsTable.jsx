import { useState } from 'react';
import allMatchupPredictions from '../data/allMatchupPredictions.json';
import BetslipModal from './BetslipModal';

const ROUND_ORDER = ['playin', 'r64', 'r32', 's16', 'e8', 'ff', 'championship'];
const ROUND_LABELS = {
  playin: 'Play-In', r64: 'Round of 64', r32: 'Round of 32',
  s16: 'Sweet 16', e8: 'Elite 8', ff: 'Final Four', championship: 'Championship',
};
const ROUND_INT = { playin: 0, r64: 1, r32: 2, s16: 3, e8: 4, ff: 5, championship: 6 };

function abbr(name) {
  if (!name) return '?';
  return name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
}

function WinBadge({ team, prob }) {
  const pct = Math.round(prob * 100);
  return (
    <span className="pt-winner">
      <span className="pt-name">{team}</span>
      <span className="pt-prob">{pct}%</span>
    </span>
  );
}

function ModelCells({ pred }) {
  if (!pred) return <td colSpan={3} className="pt-na">—</td>;
  return (
    <>
      <td className="pt-pick"><WinBadge team={pred.predWinner} prob={pred.winProb} /></td>
      <td className="pt-spread">
        {pred.spread != null && pred.predWinner
          ? <div className="odds-line spread-neg">{abbr(pred.predWinner)}: -{Math.abs(pred.spread).toFixed(1)}</div>
          : '—'}
      </td>
      <td className="pt-total">
        {pred.total != null
          ? <div className="odds-line">{pred.total.toFixed(1)}</div>
          : '—'}
      </td>
    </>
  );
}

// oddsData: { moneyline: { teamName: string }, spread: { teamName: { line, odds } }, total: { line, overOdds, underOdds } }
function LiveOddsCells({ oddsData, topName, botName }) {
  if (!oddsData) {
    return (
      <>
        <td className="pt-na">—</td>
        <td className="pt-na">—</td>
        <td className="pt-na">—</td>
      </>
    );
  }
  const { moneyline, spread, total } = oddsData;
  const topML = moneyline?.[topName] ?? null;
  const botML = moneyline?.[botName] ?? null;
  const topSpread = spread?.[topName] ?? null;
  const botSpread = spread?.[botName] ?? null;

  return (
    <>
      <td className="pt-odds-ml">
        {topML || botML
          ? <>
              <div className="odds-line"><span className="odds-team-name">{topName}</span> {topML ?? '—'}</div>
              <div className="odds-line"><span className="odds-team-name">{botName}</span> {botML ?? '—'}</div>
            </>
          : <span className="pt-na">—</span>}
      </td>
      <td className="pt-odds-spread">
        {topSpread || botSpread
          ? <>
              <div className="odds-line"><span className="odds-team-name">{topName}</span> {topSpread?.line ?? '—'} <span className="odds-juice">({topSpread?.odds ?? '—'})</span></div>
              <div className="odds-line"><span className="odds-team-name">{botName}</span> {botSpread?.line ?? '—'} <span className="odds-juice">({botSpread?.odds ?? '—'})</span></div>
            </>
          : <span className="pt-na">—</span>}
      </td>
      <td className="pt-odds-total">
        {total
          ? <>
              <div className="odds-line">o{total.line} <span className="odds-juice">({total.overOdds ?? '—'})</span></div>
              <div className="odds-line">u{total.line} <span className="odds-juice">({total.underOdds ?? '—'})</span></div>
            </>
          : <span className="pt-na">—</span>}
      </td>
    </>
  );
}

export default function PredictionsTable({ games, predictedRounds, resolveTeams, oddsMap, oddsLoading, oddsError, onRefreshOdds, gender }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBetslip, setShowBetslip] = useState(false);

  let displayRound = null;
  for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
    const r = ROUND_ORDER[i];
    if (predictedRounds.has(r) && r !== 'playin') { displayRound = r; break; }
  }
  if (!displayRound) return null;

  const roundGames = games.filter((g) => g.round === displayRound);
  if (!roundGames.length) return null;

  const prefix = gender === 'womens' ? 'w' : 'm';
  const roundIdx = ROUND_INT[displayRound] ?? 1;

  const rows = roundGames.map((g) => {
    const { topTeam, botTeam } = resolveTeams(g);
    const topName = topTeam?.name ?? null;
    const botName = botTeam?.name ?? null;
    if (!topName || !botName) return null;
    const [a, b] = [topName, botName].sort();
    const entry = allMatchupPredictions[`${prefix}:${a}|${b}`];
    if (!entry) return null;
    const mp = {
      seeded:           entry.seeded              ?? null,
      noSeed:           entry.noSeed              ?? null,
      unbalanced_rounds: entry.unbalanced_rounds?.[String(roundIdx)] ?? null,
      balanced_rounds:   entry.balanced_rounds?.[String(roundIdx)]   ?? null,
      kaggle:           entry.kaggle              ?? null,
    };
    return { game: g, mp, topName, botName };
  }).filter(Boolean);

  if (!rows.length) return null;

  const hasAnyOdds = Object.keys(oddsMap ?? {}).length > 0;

  function toggleRow(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const betslipItems = rows
    .filter(({ game }) => selectedIds.has(game.id))
    .map(({ game, topName, botName, mp }) => ({
      id:        game.id,
      topName,
      botName,
      oddsData:  oddsMap?.[game.id]?.dk ?? null,
      modelData: { seeded: mp.seeded ?? null, noSeed: mp.noSeed ?? null },
    }));

  return (
    <>
    <div className="predictions-table-section">
      <div className="predictions-table-header">
        <div className="predictions-table-title-row">
          <span className="predictions-table-title">
            {ROUND_LABELS[displayRound]} — Model Predictions &amp; Live Odds
          </span>
          <span className="predictions-table-subtitle">Test set 2024–2025 · Win Acc / Spread MAE / Total MAE</span>
        </div>
        <div className="predictions-table-actions">
          <button
            className={`betslip-open-btn${selectedIds.size > 0 ? ' active' : ''}`}
            onClick={() => setShowBetslip(true)}
            disabled={selectedIds.size === 0}
          >
            Create Betslip {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          <button
            className={`odds-refresh-btn${oddsLoading ? ' odds-refresh-loading' : ''}`}
            onClick={onRefreshOdds}
            disabled={oddsLoading}
          >
            {oddsLoading ? '⟳ Fetching…' : '⟳ Refresh Odds'}
          </button>
          {!oddsLoading && !oddsError && !hasAnyOdds && (
            <span className="odds-status">No lines available yet</span>
          )}
          {oddsError && <span className="odds-error">Error: {oddsError}</span>}
        </div>
      </div>
      <div className="predictions-table-wrap">
        <table className="predictions-table">
          <thead>
            <tr>
              <th className="pt-col-check" rowSpan={2}></th>
              <th className="pt-col-matchup" rowSpan={2}>Matchup</th>
              <th className="pt-col-model" colSpan={3}>With Seeds <span className="pt-acc">Win Acc 73.5% · Spd MAE 10.1 · Total MAE 14.2</span></th>
              <th className="pt-col-divider" rowSpan={2}></th>
              <th className="pt-col-model" colSpan={3}>No Seeds <span className="pt-acc">Win Acc 63.1% · Spd MAE 11.3 · Total MAE 14.2</span></th>
              <th className="pt-col-divider" rowSpan={2}></th>
              <th className="pt-col-model" colSpan={3}>Unbalanced Rounds <span className="pt-acc">Win Acc 99.7% · Spd MAE 2.4 · Total MAE 2.8</span></th>
              <th className="pt-col-divider" rowSpan={2}></th>
              <th className="pt-col-model pt-col-model-highlight" colSpan={3}>Balanced Rounds <span className="pt-acc">Win Acc 81.2% · Spd MAE 9.9 · Total MAE 15.6</span></th>
              <th className="pt-col-divider" rowSpan={2}></th>
              <th className="pt-col-model pt-col-model-highlight" colSpan={3}>Kaggle <span className="pt-acc">Win Acc 80.0% · Spd MAE 8.3† · Total MAE 10.8†</span></th>
              <th className="pt-col-divider-wide" rowSpan={2}></th>
              <th className="pt-col-book" colSpan={3}>DraftKings</th>
            </tr>
            <tr className="pt-subheader">
              <th>Pick</th><th>Spread</th><th>O/U</th>
              <th>Pick</th><th>Spread</th><th>O/U</th>
              <th>Pick</th><th>Spread</th><th>O/U</th>
              <th>Pick</th><th>Spread</th><th>O/U</th>
              <th>Pick</th><th>Spread</th><th>O/U</th>
              <th>ML</th><th>Spread</th><th>O/U</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ game, mp, topName, botName }) => {
              const gameOdds = oddsMap?.[game.id]?.dk ?? null;
              const checked  = selectedIds.has(game.id);

              return (
                <tr key={game.id} className={`pt-row${checked ? ' pt-row-checked' : ''}`}>
                  <td className="pt-check">
                    <input
                      type="checkbox"
                      className="pt-checkbox"
                      checked={checked}
                      onChange={() => toggleRow(game.id)}
                    />
                  </td>
                  <td className="pt-matchup">
                    <span className="pt-team">{topName}</span>
                    <span className="pt-vs"> vs </span>
                    <span className="pt-team">{botName}</span>
                    {game.region && <span className="pt-region">{game.region}</span>}
                  </td>
                  <ModelCells pred={mp.seeded} />
                  <td className="pt-col-divider"></td>
                  <ModelCells pred={mp.noSeed} />
                  <td className="pt-col-divider"></td>
                  <ModelCells pred={mp.unbalanced_rounds} />
                  <td className="pt-col-divider"></td>
                  <ModelCells pred={mp.balanced_rounds} />
                  <td className="pt-col-divider"></td>
                  <ModelCells pred={mp.kaggle} />
                  <td className="pt-col-divider-wide"></td>
                  <LiveOddsCells oddsData={gameOdds} topName={topName} botName={botName} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    {showBetslip && (
      <BetslipModal items={betslipItems} onClose={() => setShowBetslip(false)} />
    )}
    </>
  );
}
