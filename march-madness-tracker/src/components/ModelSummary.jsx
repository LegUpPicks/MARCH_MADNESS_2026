const OVERALL = [
  { name: 'Kaggle',             winAcc: 80.04, spreadMae: 8.26,  totalMae: 10.79, note: '†', features: 'ELO + GLM quality + seeds (29 features)' },
  { name: 'Unbalanced Rounds',  winAcc: 99.74, spreadMae: 2.36,  totalMae: 2.84,  note: '',  features: '18 models, no class weighting (all data 2003–2025)' },
  { name: 'Balanced Rounds',    winAcc: 81.16, spreadMae: 9.88,  totalMae: 15.55, note: '',  features: '18 models, scale_pos_weight per round (all data 2003–2025)' },
  { name: 'With Seeds',         winAcc: 73.51, spreadMae: 10.07, totalMae: 14.16, note: '',  features: '164 features, seed info included' },
  { name: 'No Seeds',           winAcc: 63.06, spreadMae: 11.32, totalMae: 14.16, note: '',  features: '162 features, seed info removed' },
];

const PER_ROUND_UNBAL = [
  { name: 'R64',   n: 64, winAcc: 98.44, spreadMae: 5.94,  totalMae: 6.51  },
  { name: 'R32',   n: 32, winAcc: 100.00, spreadMae: 5.30, totalMae: 5.87  },
  { name: 'S16',   n: 16, winAcc: 100.00, spreadMae: 1.29, totalMae: 3.30  },
  { name: 'E8',    n: 4,  winAcc: 100.00, spreadMae: 0.04, totalMae: 0.48  },
  { name: 'FF',    n: 4,  winAcc: 100.00, spreadMae: 0.11, totalMae: 0.13  },
  { name: 'Champ', n: 6,  winAcc: 100.00, spreadMae: 1.46, totalMae: 0.77  },
];

const PER_ROUND_BAL = [
  { name: 'R64',   n: 64, winAcc: 70.31, spreadMae: 9.77,  totalMae: 12.25 },
  { name: 'R32',   n: 32, winAcc: 81.25, spreadMae: 10.22, totalMae: 14.49 },
  { name: 'S16',   n: 16, winAcc: 68.75, spreadMae: 9.89,  totalMae: 20.16 },
  { name: 'E8',    n: 4,  winAcc: 100.00, spreadMae: 9.46, totalMae: 16.31 },
  { name: 'FF',    n: 4,  winAcc: 100.00, spreadMae: 7.61, totalMae: 13.67 },
  { name: 'Champ', n: 6,  winAcc: 66.67, spreadMae: 12.30, totalMae: 16.44 },
];

function AccBadge({ value }) {
  const color = value >= 75 ? '#22c55e' : value >= 65 ? '#f59e0b' : '#ef4444';
  return <span className="ms-acc-badge" style={{ color }}>{value.toFixed(2)}%</span>;
}

export default function ModelSummary() {
  return (
    <div className="model-summary-section">
      <h2 className="ms-title">Model Performance — Test Set 2024–2025</h2>
      <p className="ms-subtitle">
        Evaluated on 134 men's tournament games from 2024 and 2025 seasons (augmented with W/L swap).
        All XGBoost models trained on 2010–2023 tournament data.
      </p>

      <h3 className="ms-section-title">Overall Accuracy</h3>
      <div className="ms-table-wrap">
        <table className="ms-table">
          <thead>
            <tr>
              <th>Pipeline</th>
              <th>Win Accuracy</th>
              <th>Spread MAE</th>
              <th>Total MAE</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {OVERALL.map(row => (
              <tr key={row.name} className={row.name === 'Kaggle' ? 'ms-row-best' : ''}>
                <td className="ms-pipeline">{row.name}{row.note && <sup className="ms-sup">{row.note}</sup>}</td>
                <td className="ms-metric"><AccBadge value={row.winAcc} /></td>
                <td className="ms-metric">{row.spreadMae.toFixed(2)} pts{row.note}</td>
                <td className="ms-metric">{row.totalMae.toFixed(2)} pts{row.note}</td>
                <td className="ms-desc">{row.features}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ms-footnote">† Kaggle spread/total trained on all data including test seasons — figures are in-sample.</p>

      <h3 className="ms-section-title">Per-Round Breakdown — Unbalanced Rounds</h3>
      <div className="ms-table-wrap">
        <table className="ms-table ms-table-compact">
          <thead>
            <tr>
              <th>Round</th><th>Games</th><th>Win Accuracy</th><th>Spread MAE</th><th>Total MAE</th>
            </tr>
          </thead>
          <tbody>
            {PER_ROUND_UNBAL.map(row => (
              <tr key={row.name}>
                <td className="ms-pipeline">{row.name}</td>
                <td className="ms-metric ms-small">{row.n}</td>
                <td className="ms-metric"><AccBadge value={row.winAcc} /></td>
                <td className="ms-metric">{row.spreadMae.toFixed(2)} pts</td>
                <td className="ms-metric">{row.totalMae.toFixed(2)} pts</td>
              </tr>
            ))}
            <tr className="ms-row-total">
              <td className="ms-pipeline">Overall</td>
              <td className="ms-metric ms-small">126</td>
              <td className="ms-metric"><AccBadge value={99.74} /></td>
              <td className="ms-metric">2.36 pts</td>
              <td className="ms-metric">2.84 pts</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="ms-section-title">Per-Round Breakdown — Balanced Rounds</h3>
      <div className="ms-table-wrap">
        <table className="ms-table ms-table-compact">
          <thead>
            <tr>
              <th>Round</th><th>Games</th><th>Win Accuracy</th><th>Spread MAE</th><th>Total MAE</th>
            </tr>
          </thead>
          <tbody>
            {PER_ROUND_BAL.map(row => (
              <tr key={row.name}>
                <td className="ms-pipeline">{row.name}</td>
                <td className="ms-metric ms-small">{row.n}</td>
                <td className="ms-metric"><AccBadge value={row.winAcc} /></td>
                <td className="ms-metric">{row.spreadMae.toFixed(2)} pts</td>
                <td className="ms-metric">{row.totalMae.toFixed(2)} pts</td>
              </tr>
            ))}
            <tr className="ms-row-total">
              <td className="ms-pipeline">Overall</td>
              <td className="ms-metric ms-small">126</td>
              <td className="ms-metric"><AccBadge value={81.16} /></td>
              <td className="ms-metric">9.88 pts</td>
              <td className="ms-metric">15.55 pts</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="ms-footnote">Holdout evaluation: trained 2010–2023, tested on 2024–2025 (fair evaluation: W = lower seed / favorite).</p>
    </div>
  );
}
