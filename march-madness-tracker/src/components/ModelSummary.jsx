const OVERALL = [
  { name: 'Kaggle',     winAcc: 80.04, spreadMae: 8.26,  totalMae: 10.79, note: '†', features: 'ELO + GLM quality + seeds (29 features)' },
  { name: 'With Seeds', winAcc: 73.51, spreadMae: 10.07, totalMae: 14.16, note: '',  features: '164 features, seed info included' },
  { name: 'Per-Round',  winAcc: 71.83, spreadMae: 9.87,  totalMae: 14.05, note: '',  features: '18 models (win/spread/total × 6 rounds)' },
  { name: 'No Seeds',   winAcc: 63.06, spreadMae: 11.32, totalMae: 14.16, note: '',  features: '162 features, seed info removed' },
];

const PER_ROUND = [
  { name: 'R64',   n: 64, winAcc: 77.34, spreadMae: 9.78,  totalMae: 12.19 },
  { name: 'R32',   n: 32, winAcc: 75.00, spreadMae: 10.33, totalMae: 14.62 },
  { name: 'S16',   n: 16, winAcc: 59.38, spreadMae: 9.47,  totalMae: 19.27 },
  { name: 'E8',    n: 4,  winAcc: 75.00, spreadMae: 8.99,  totalMae: 16.23 },
  { name: 'FF',    n: 4,  winAcc: 25.00, spreadMae: 7.00,  totalMae: 13.78 },
  { name: 'Champ', n: 6,  winAcc: 58.33, spreadMae: 11.87, totalMae: 15.72 },
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

      <h3 className="ms-section-title">Per-Round Breakdown (Per-Round Pipeline)</h3>
      <div className="ms-table-wrap">
        <table className="ms-table ms-table-compact">
          <thead>
            <tr>
              <th>Round</th>
              <th>Games</th>
              <th>Win Accuracy</th>
              <th>Spread MAE</th>
              <th>Total MAE</th>
            </tr>
          </thead>
          <tbody>
            {PER_ROUND.map(row => (
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
              <td className="ms-metric"><AccBadge value={71.83} /></td>
              <td className="ms-metric">9.87 pts</td>
              <td className="ms-metric">14.05 pts</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
