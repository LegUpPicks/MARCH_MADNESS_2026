const OVERALL = [
  { name: 'Kaggle',             winAcc: 80.04, spreadMae: 8.26,  totalMae: 10.79, note: '†', features: 'ELO + GLM quality + seeds (29 features)' },
  { name: 'Unbalanced Rounds',  winAcc: 76.87, spreadMae: 10.20, totalMae: 14.63, note: '',  features: '18 models, no class weighting (2010–2025)' },
  { name: 'Balanced Rounds',    winAcc: 96.27, spreadMae: 11.66, totalMae: 14.34, note: '',  features: '18 models, scale_pos_weight + sample_weight per round (2010–2025)' },
  { name: 'With Seeds',         winAcc: 73.51, spreadMae: 10.07, totalMae: 14.16, note: '',  features: '164 features, seed info included' },
  { name: 'No Seeds',           winAcc: 63.06, spreadMae: 11.32, totalMae: 14.16, note: '',  features: '162 features, seed info removed' },
];

const PER_ROUND_UNBAL = [
  { name: 'R64',   n: 64, winAcc: 78.12, spreadMae: 9.77,  totalMae: 12.25 },
  { name: 'R32',   n: 32, winAcc: 78.12, spreadMae: 10.22, totalMae: 14.49 },
  { name: 'S16',   n: 16, winAcc: 93.75, spreadMae: 9.89,  totalMae: 20.16 },
  { name: 'E8',    n: 4,  winAcc: 75.00, spreadMae: 9.46,  totalMae: 16.31 },
  { name: 'FF',    n: 4,  winAcc: 25.00, spreadMae: 7.61,  totalMae: 13.67 },
  { name: 'Champ', n: 6,  winAcc: 66.67, spreadMae: 12.30, totalMae: 16.44 },
];

const PER_ROUND_BAL = [
  { name: 'R64',   n: 64, winAcc: 98.44, spreadMae: 11.37, totalMae: 12.68 },
  { name: 'R32',   n: 32, winAcc: 100.00, spreadMae: 11.82, totalMae: 14.28 },
  { name: 'S16',   n: 16, winAcc: 100.00, spreadMae: 10.18, totalMae: 16.93 },
  { name: 'E8',    n: 4,  winAcc: 100.00, spreadMae: 14.94, totalMae: 17.24 },
  { name: 'FF',    n: 4,  winAcc: 100.00, spreadMae: 15.74, totalMae: 14.68 },
  { name: 'Champ', n: 6,  winAcc: 83.33, spreadMae: 9.48,  totalMae: 13.96 },
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
              <td className="ms-metric"><AccBadge value={76.87} /></td>
              <td className="ms-metric">10.20 pts</td>
              <td className="ms-metric">14.63 pts</td>
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
              <td className="ms-metric"><AccBadge value={96.27} /></td>
              <td className="ms-metric">11.66 pts</td>
              <td className="ms-metric">14.34 pts</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="ms-footnote">Holdout evaluation: trained 2010–2023, tested on 2024–2025 (fair evaluation: W = lower seed / favorite). Balanced model uses scale_pos_weight + sample_weight on all three sub-models per round.</p>
    </div>
  );
}
