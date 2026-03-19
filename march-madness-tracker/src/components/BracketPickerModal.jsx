import { useState } from 'react';
import allMatchupPredictions from '../data/allMatchupPredictions.json';

const ROUND_INT = { playin: 0, r64: 1, r32: 2, s16: 3, e8: 4, ff: 5, championship: 6 };

const MODELS = [
  { key: 'balanced_rounds',   label: 'Balanced Rounds',   acc: '96.3%', perRound: true,  primary: true },
  { key: 'unbalanced_rounds', label: 'Unbalanced Rounds', acc: '76.9%', perRound: true },
  { key: 'seeded',            label: 'With Seeds',         acc: '73.5%' },
  { key: 'noSeed',            label: 'No Seeds',           acc: '63.1%' },
  { key: 'kaggle',            label: 'Kaggle',             acc: '80.0%†' },
];

// Same rule as bracketData.getRecommendedWinner but operates on the predictions array.
// Default to Balanced Rounds; override only if ALL 4 other models unanimously disagree.
function getRecommendedWinner(predsArray) {
  const balanced = predsArray.find(p => p.primary)?.pred?.predWinner ?? null;
  if (!balanced) return predsArray[0]?.pred?.predWinner ?? null;

  const others = predsArray.filter(p => !p.primary && p.pred?.predWinner);
  if (others.length < 4) return balanced; // not enough votes to override

  const disagreers = others.filter(p => p.pred.predWinner !== balanced);
  if (disagreers.length !== 4) return balanced;

  const consensusPick = disagreers[0].pred.predWinner;
  return disagreers.every(p => p.pred.predWinner === consensusPick) ? consensusPick : balanced;
}

export default function BracketPickerModal({ game, topTeam, botTeam, gender, onConfirm, onClose }) {
  const [staged, setStaged] = useState(null);

  const prefix = gender === 'womens' ? 'w' : 'm';
  const roundIdx = ROUND_INT[game.round] ?? 1;
  const [a, b] = [topTeam.name.replace(/\*$/, ''), botTeam.name.replace(/\*$/, '')].sort();
  const entry = allMatchupPredictions[`${prefix}:${a}|${b}`];

  const predictions = MODELS.map(({ key, label, acc, perRound, primary }) => {
    const pred = perRound
      ? entry?.[key]?.[String(roundIdx)] ?? null
      : entry?.[key] ?? null;
    return { key, label, acc, primary: !!primary, pred };
  }).filter(p => p.pred != null);

  const recommendedWinner = getRecommendedWinner(predictions);

  function handleConfirm() {
    if (staged) { onConfirm(staged); }
  }

  function toggleStaged(name) {
    setStaged(prev => prev === name ? null : name);
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()}>

        <div className="picker-header">
          <span className="picker-title">Pick Winner</span>
          <button className="picker-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="picker-teams">
          {[topTeam, botTeam].map(team => {
            const isStaged    = staged === team.name;
            const isRecommended = recommendedWinner === team.name;
            return (
              <button
                key={team.name}
                className={[
                  'picker-team-btn',
                  isStaged       ? 'picker-team-staged'      : '',
                  isRecommended  ? 'picker-team-model-pick'  : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggleStaged(team.name)}
              >
                <span className="picker-seed">{team.seed}</span>
                <span className="picker-name">{team.name}</span>
                {isRecommended && <span className="picker-model-star" title="Model consensus pick">★</span>}
              </button>
            );
          })}
        </div>

        {predictions.length > 0 && (
          <div className="picker-preds">
            <div className="picker-preds-header">Model Predictions</div>
            {predictions.map(({ key, label, acc, primary, pred }) => {
              const agrees    = staged != null && pred.predWinner === staged;
              const disagrees = staged != null && pred.predWinner !== staged;
              const pct       = Math.round((pred.winProb ?? 0) * 100);
              const spread    = pred.spread != null ? Math.abs(pred.spread).toFixed(1) : null;
              const total     = pred.total  != null ? pred.total.toFixed(1) : null;
              return (
                <div
                  key={key}
                  className={[
                    'picker-pred-row',
                    primary    ? 'picker-pred-primary' : '',
                    agrees     ? 'picker-pred-agrees'  : '',
                    disagrees  ? 'picker-pred-disagrees' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="picker-pred-label">{label}<span className="picker-pred-acc">{acc}</span></span>
                  <span className="picker-pred-winner">{pred.predWinner}</span>
                  <span className="picker-pred-pct">{pct}%</span>
                  {spread && <span className="picker-pred-spread">-{spread}</span>}
                  {total  && <span className="picker-pred-total">o/u {total}</span>}
                </div>
              );
            })}
          </div>
        )}

        <div className="picker-footer">
          <button className="picker-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="picker-confirm-btn"
            disabled={!staged}
            onClick={handleConfirm}
          >
            {staged ? `Confirm: ${staged}` : 'Select a team above'}
          </button>
        </div>

      </div>
    </div>
  );
}
