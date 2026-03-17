import { getConfidence } from '../data/bracketData';

const CONFIDENCE_COLORS = {
  high: '#3fb950',
  medium: '#d29922',
  low: '#f85149',
  unknown: '#8b949e',
};

export default function GameCard({ game, selection, onSelect }) {
  const { topTeam, botTeam, prediction } = game;

  const predictedWinner = prediction ? prediction.winner : null;
  const hasSelection = !!selection;

  // Determine color states
  const topSelected = selection === topTeam.name;
  const botSelected = selection === botTeam.name;
  const topPredicted = predictedWinner === topTeam.name;
  const botPredicted = predictedWinner === botTeam.name;

  // Correctness: only when selection exists
  const topCorrect = topSelected && topPredicted;
  const topWrong = topSelected && !topPredicted;
  const botCorrect = botSelected && botPredicted;
  const botWrong = botSelected && !botPredicted;

  const confidence = getConfidence(game);
  const confColor = CONFIDENCE_COLORS[confidence];

  const margin =
    prediction && prediction.spreadRaw !== null
      ? Math.abs(prediction.spreadRaw).toFixed(1)
      : null;

  const total =
    prediction && prediction.total !== null
      ? prediction.total.toFixed(1)
      : null;

  function getTeamClass(isTop) {
    const isSelected = isTop ? topSelected : botSelected;
    const isCorrect = isTop ? topCorrect : botCorrect;
    const isWrong = isTop ? topWrong : botWrong;
    const isPredicted = isTop ? topPredicted : botPredicted;

    let cls = 'team-row';
    if (isCorrect) cls += ' team-correct';
    else if (isWrong) cls += ' team-wrong';
    else if (isSelected) cls += ' team-selected';

    if (isPredicted && !hasSelection) cls += ' team-predicted';

    return cls;
  }

  function getStatusText() {
    if (!hasSelection) return null;
    const predWinner = predictedWinner;
    if (selection === predWinner) return { text: 'Correct!', cls: 'status-correct' };
    return { text: 'Wrong', cls: 'status-wrong' };
  }

  const status = getStatusText();

  return (
    <div className="game-card">
      <div className="game-card-inner">
        {/* Top team */}
        <div
          className={getTeamClass(true)}
          onClick={() => onSelect(topTeam.name)}
          title={`Click to mark ${topTeam.name} as winner`}
        >
          <span className="team-seed">{topTeam.seed}</span>
          <span className="team-name">{topTeam.name}</span>
          {topPredicted && <span className="pred-star">★</span>}
        </div>

        {/* Divider with stats */}
        <div className="game-meta">
          <span className="conf-dot" style={{ background: confColor }} title={`Confidence: ${confidence}`} />
          {margin !== null && (
            <span className="game-spread" title="Predicted margin">
              {margin}
            </span>
          )}
          {total !== null && (
            <span className="game-total" title="Predicted total">
              o/u {total}
            </span>
          )}
          {status && (
            <span className={`game-status ${status.cls}`}>{status.text}</span>
          )}
        </div>

        {/* Bottom team */}
        <div
          className={getTeamClass(false)}
          onClick={() => onSelect(botTeam.name)}
          title={`Click to mark ${botTeam.name} as winner`}
        >
          <span className="team-seed">{botTeam.seed}</span>
          <span className="team-name">{botTeam.name}</span>
          {botPredicted && <span className="pred-star">★</span>}
        </div>
      </div>
    </div>
  );
}
