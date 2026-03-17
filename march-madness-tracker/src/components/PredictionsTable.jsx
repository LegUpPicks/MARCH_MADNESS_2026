import modelPredictions from '../data/modelPredictions.json';

const ROUND_ORDER = ['playin', 'r64', 'r32', 's16', 'e8', 'ff', 'championship'];
const ROUND_LABELS = {
  playin: 'Play-In', r64: 'Round of 64', r32: 'Round of 32',
  s16: 'Sweet 16', e8: 'Elite 8', ff: 'Final Four', championship: 'Championship',
};

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

export default function PredictionsTable({ games, predictedRounds, resolveTeams, oddsMap, oddsLoading, oddsError, onRefreshOdds }) {
  let displayRound = null;
  for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
    const r = ROUND_ORDER[i];
    if (predictedRounds.has(r) && r !== 'playin') { displayRound = r; break; }
  }
  if (!displayRound) return null;

  const roundGames = games.filter((g) => g.round === displayRound);
  if (!roundGames.length) return null;

  const rows = roundGames.map((g) => {
    const mp = modelPredictions[g.id];
    const { topTeam, botTeam } = resolveTeams(g);
    return { game: g, mp, topTeam, botTeam };
  }).filter((r) => r.mp);

  if (!rows.length) return null;

  const hasAnyOdds = Object.keys(oddsMap ?? {}).length > 0;

  return (
    <div className="predictions-table-section">
      <div className="predictions-table-header">
        <div className="predictions-table-title-row">
          <span className="predictions-table-title">
            {ROUND_LABELS[displayRound]} — Model Predictions &amp; Live Odds
          </span>
          <span className="predictions-table-subtitle">Seeded Model vs No-Seed Model</span>
        </div>
        <div className="predictions-table-actions">
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
              <th className="pt-col-matchup" rowSpan={2}>Matchup</th>
              <th className="pt-col-model" colSpan={3}>With Seeds</th>
              <th className="pt-col-divider" rowSpan={2}></th>
              <th className="pt-col-model" colSpan={3}>No Seeds</th>
              <th className="pt-col-divider-wide" rowSpan={2}></th>
              <th className="pt-col-book" colSpan={3}>DraftKings</th>
            </tr>
            <tr className="pt-subheader">
              <th>Pick</th><th>Spread</th><th>O/U</th>
              <th>Pick</th><th>Spread</th><th>O/U</th>
              <th>ML</th><th>Spread</th><th>O/U</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ game, mp, topTeam, botTeam }) => {
              const s  = mp.seeded;
              const ns = mp.noSeed;
              const topName  = topTeam?.name ?? mp.wTeam;
              const botName  = botTeam?.name ?? mp.lTeam;
              const agree    = s && ns && s.predWinner === ns.predWinner;
              const gameOdds = oddsMap?.[game.id]?.dk ?? null;

              return (
                <tr key={game.id} className={agree ? 'pt-row' : 'pt-row pt-row-disagree'}>
                  <td className="pt-matchup">
                    <span className="pt-team">{topName}</span>
                    <span className="pt-vs"> vs </span>
                    <span className="pt-team">{botName}</span>
                    {game.region && <span className="pt-region">{game.region}</span>}
                  </td>
                  {s ? (
                    <>
                      <td className="pt-pick"><WinBadge team={s.predWinner} prob={s.winProb} /></td>
                      <td className="pt-spread">
                        {s.spread !== null && s.predWinner
                          ? <>
                              <div className="odds-line spread-neg">{abbr(s.predWinner)}: -{Math.abs(s.spread).toFixed(1)}</div>
                              {gameOdds?.spread?.[s.predWinner]?.odds && <div className="odds-line odds-juice">({gameOdds.spread[s.predWinner].odds})</div>}
                            </>
                          : '—'}
                      </td>
                      <td className="pt-total">
                        {s.total !== null
                          ? <>
                              <div className="odds-line">{s.total.toFixed(1)}</div>
                              {gameOdds?.total && (
                                <div className="odds-line odds-juice">o{gameOdds.total.overOdds ?? '—'} u{gameOdds.total.underOdds ?? '—'}</div>
                              )}
                            </>
                          : '—'}
                      </td>
                    </>
                  ) : <td colSpan={3} className="pt-na">—</td>}
                  <td className="pt-col-divider"></td>
                  {ns ? (
                    <>
                      <td className="pt-pick"><WinBadge team={ns.predWinner} prob={ns.winProb} /></td>
                      <td className="pt-spread">
                        {ns.spread !== null && ns.predWinner
                          ? <>
                              <div className="odds-line spread-neg">{abbr(ns.predWinner)}: -{Math.abs(ns.spread).toFixed(1)}</div>
                              {gameOdds?.spread?.[ns.predWinner]?.odds && <div className="odds-line odds-juice">({gameOdds.spread[ns.predWinner].odds})</div>}
                            </>
                          : '—'}
                      </td>
                      <td className="pt-total">
                        {ns.total !== null
                          ? <>
                              <div className="odds-line">{ns.total.toFixed(1)}</div>
                              {gameOdds?.total && (
                                <div className="odds-line odds-juice">o{gameOdds.total.overOdds ?? '—'} u{gameOdds.total.underOdds ?? '—'}</div>
                              )}
                            </>
                          : '—'}
                      </td>
                    </>
                  ) : <td colSpan={3} className="pt-na">—</td>}
                  <td className="pt-col-divider-wide"></td>
                  <LiveOddsCells oddsData={gameOdds} topName={topName} botName={botName} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
