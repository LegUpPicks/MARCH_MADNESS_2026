import modelPredictions from '../data/modelPredictions.json';

const ROUND_ORDER = ['playin', 'r64', 'r32', 's16', 'e8', 'ff', 'championship'];
const ROUND_LABELS = {
  playin: 'Play-In', r64: 'Round of 64', r32: 'Round of 32',
  s16: 'Sweet 16', e8: 'Elite 8', ff: 'Final Four', championship: 'Championship',
};

function WinBadge({ team, prob, isTop }) {
  const pct = Math.round(prob * 100);
  return (
    <span className="pt-winner">
      <span className="pt-name">{team}</span>
      <span className="pt-prob">{pct}%</span>
    </span>
  );
}

export default function PredictionsTable({ games, predictedRounds, resolveTeams }) {
  // Find the highest predicted non-trivial round to display
  let displayRound = null;
  for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
    const r = ROUND_ORDER[i];
    if (predictedRounds.has(r) && r !== 'playin') {
      displayRound = r;
      break;
    }
  }
  if (!displayRound) return null;

  const roundGames = games.filter((g) => g.round === displayRound);
  if (!roundGames.length) return null;

  // Only show games with predictions in modelPredictions.json
  const rows = roundGames.map((g) => {
    const mp = modelPredictions[g.id];
    const { topTeam, botTeam } = resolveTeams(g);
    return { game: g, mp, topTeam, botTeam };
  }).filter((r) => r.mp);

  if (!rows.length) return null;

  return (
    <div className="predictions-table-section">
      <div className="predictions-table-header">
        <span className="predictions-table-title">
          {ROUND_LABELS[displayRound]} — Model Predictions
        </span>
        <span className="predictions-table-subtitle">Seeded Model vs No-Seed Model</span>
      </div>
      <div className="predictions-table-wrap">
        <table className="predictions-table">
          <thead>
            <tr>
              <th className="pt-col-matchup">Matchup</th>
              <th className="pt-col-model" colSpan={3}>With Seeds</th>
              <th className="pt-col-divider"></th>
              <th className="pt-col-model" colSpan={3}>No Seeds</th>
            </tr>
            <tr className="pt-subheader">
              <th></th>
              <th>Pick</th>
              <th>Spread</th>
              <th>O/U</th>
              <th className="pt-col-divider"></th>
              <th>Pick</th>
              <th>Spread</th>
              <th>O/U</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ game, mp, topTeam, botTeam }) => {
              const s = mp.seeded;
              const ns = mp.noSeed;
              // Resolved team names (if user picked different than default)
              const topName = topTeam?.name ?? mp.wTeam;
              const botName = botTeam?.name ?? mp.lTeam;
              // Determine if seeded/noseed agree
              const agree = s && ns && s.predWinner === ns.predWinner;
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
                      <td className="pt-pick">
                        <WinBadge team={s.predWinner} prob={s.winProb} />
                      </td>
                      <td className="pt-spread">
                        {s.spread !== null
                          ? <span className={s.spread >= 0 ? 'spread-pos' : 'spread-neg'}>
                              {s.spread > 0 ? '+' : ''}{s.spread.toFixed(1)}
                            </span>
                          : '—'}
                      </td>
                      <td className="pt-total">{s.total !== null ? s.total.toFixed(1) : '—'}</td>
                    </>
                  ) : (
                    <td colSpan={3} className="pt-na">—</td>
                  )}
                  <td className="pt-col-divider"></td>
                  {ns ? (
                    <>
                      <td className="pt-pick">
                        <WinBadge team={ns.predWinner} prob={ns.winProb} />
                      </td>
                      <td className="pt-spread">
                        {ns.spread !== null
                          ? <span className={ns.spread >= 0 ? 'spread-pos' : 'spread-neg'}>
                              {ns.spread > 0 ? '+' : ''}{ns.spread.toFixed(1)}
                            </span>
                          : '—'}
                      </td>
                      <td className="pt-total">{ns.total !== null ? ns.total.toFixed(1) : '—'}</td>
                    </>
                  ) : (
                    <td colSpan={3} className="pt-na">—</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
