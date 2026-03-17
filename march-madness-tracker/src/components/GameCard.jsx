const CONFIDENCE_COLORS = {
  high: '#3fb950',
  medium: '#d29922',
  low: '#f85149',
  unknown: '#8b949e',
};

function confFromPred(prediction) {
  if (!prediction || prediction.spreadRaw === null) return 'unknown';
  const abs = Math.abs(prediction.spreadRaw);
  if (abs >= 10) return 'high';
  if (abs >= 5) return 'medium';
  return 'low';
}

export default function GameCard({ game, topTeam, botTeam, prediction, selection, onSelect }) {
  const isDisabled = !topTeam || !botTeam;

  const predictedWinner = prediction?.winner ?? null;
  const hasSelection = !!selection;

  const topSelected = !!topTeam && selection === topTeam.name;
  const botSelected = !!botTeam && selection === botTeam.name;
  const topPredicted = !!topTeam && predictedWinner === topTeam.name;
  const botPredicted = !!botTeam && predictedWinner === botTeam.name;

  const topCorrect = topSelected && topPredicted;
  const topWrong = topSelected && !topPredicted && !!predictedWinner;
  const botCorrect = botSelected && botPredicted;
  const botWrong = botSelected && !botPredicted && !!predictedWinner;

  const confidence = confFromPred(prediction);
  const confColor = CONFIDENCE_COLORS[confidence];
  const margin = prediction?.spreadRaw != null ? Math.abs(prediction.spreadRaw).toFixed(1) : null;
  const total = prediction?.total != null ? prediction.total.toFixed(1) : null;

  function getStatus() {
    if (!hasSelection || !predictedWinner) return null;
    return selection === predictedWinner
      ? { text: '✓', cls: 'status-correct' }
      : { text: '✗', cls: 'status-wrong' };
  }

  function teamClass(isTop) {
    if (!topTeam || !botTeam) return 'team-row team-tbd';
    const sel = isTop ? topSelected : botSelected;
    const correct = isTop ? topCorrect : botCorrect;
    const wrong = isTop ? topWrong : botWrong;
    const pred = isTop ? topPredicted : botPredicted;
    let c = 'team-row';
    if (correct) c += ' team-correct';
    else if (wrong) c += ' team-wrong';
    else if (sel) c += ' team-selected';
    if (pred && !hasSelection) c += ' team-predicted';
    return c;
  }

  const status = getStatus();

  function renderTeamRow(team, isTop) {
    if (!team) {
      return (
        <div className="team-row team-tbd" key={isTop ? 'top' : 'bot'}>
          <span className="team-seed">—</span>
          <span className="team-name" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>TBD</span>
        </div>
      );
    }
    return (
      <div
        key={team.name}
        className={teamClass(isTop)}
        onClick={() => !isDisabled && onSelect(team.name)}
        title={isDisabled ? undefined : `Mark ${team.name} as winner`}
      >
        <span className="team-seed">{team.seed}</span>
        <span className="team-name">{team.name}</span>
        {(isTop ? topPredicted : botPredicted) && prediction && (
          <span className="pred-star">★</span>
        )}
      </div>
    );
  }

  return (
    <div className={`game-card${isDisabled ? ' game-card-tbd' : ''}`}>
      <div className="game-card-inner">
        {renderTeamRow(topTeam, true)}
        <div className="game-meta">
          {prediction ? (
            <>
              <span className="conf-dot" style={{ background: confColor }} title={`Conf: ${confidence}`} />
              {margin !== null && <span className="game-spread">{margin}</span>}
              {total !== null && <span className="game-total">o/u {total}</span>}
              {status && <span className={`game-status ${status.cls}`}>{status.text}</span>}
            </>
          ) : (
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isDisabled ? '—' : 'not predicted'}
            </span>
          )}
        </div>
        {renderTeamRow(botTeam, false)}
      </div>
    </div>
  );
}
