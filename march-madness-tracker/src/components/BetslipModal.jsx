import { useState } from 'react';

function abbr(name) {
  if (!name) return '?';
  return name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
}

const BMS_MODELS = [
  { key: 'balanced_rounds',   label: 'Balanced',    primary: true },
  { key: 'unbalanced_rounds', label: 'Unbalanced' },
  { key: 'seeded',            label: 'With Seeds' },
  { key: 'noSeed',            label: 'No Seeds' },
  { key: 'kaggle',            label: 'Kaggle' },
  { key: 'ensemble',          label: 'Ensemble',    ensemble: true },
];

// ── Value-bet detection (mirrors PredictionsTable) ─────────────────────────
const SPREAD_THRESH = 5;
const TOTAL_THRESH  = 8;
const MODEL_KEYS    = ['balanced_rounds', 'unbalanced_rounds', 'seeded', 'noSeed', 'kaggle'];

function parseNum(val) {
  const n = parseFloat(String(val ?? '').replace(/[^\d.\-+]/g, ''));
  return isNaN(n) ? null : n;
}

function computeValueBet(mp, oddsData, topName, botName) {
  const bookSpreadTop = parseNum(oddsData?.spread?.[topName]?.line);
  const bookTotal     = parseNum(oddsData?.total?.line);
  if (bookSpreadTop == null && bookTotal == null) return null;

  const votes = { top: [], bot: [], over: [], under: [] };

  for (const key of MODEL_KEYS) {
    const pred = mp[key];
    if (!pred) continue;

    if (bookSpreadTop != null && pred.spread != null && pred.predWinner) {
      const modelSigned = pred.predWinner === topName
        ? -Math.abs(pred.spread)
        : +Math.abs(pred.spread);
      const div = modelSigned - bookSpreadTop;
      if (div <= -SPREAD_THRESH) votes.top.push({ cushion: Math.abs(div) });
      else if (div >= SPREAD_THRESH) votes.bot.push({ cushion: Math.abs(div) });
    }

    if (bookTotal != null && pred.total != null) {
      const div = pred.total - bookTotal;
      if (div >= TOTAL_THRESH)       votes.over.push({ cushion: Math.abs(div) });
      else if (div <= -TOTAL_THRESH) votes.under.push({ cushion: Math.abs(div) });
    }
  }

  const candidates = [
    { betLabel: `${topName} covers`, type: 'spread', votes: votes.top   },
    { betLabel: `${botName} covers`, type: 'spread', votes: votes.bot   },
    { betLabel: 'Over',              type: 'total',  votes: votes.over  },
    { betLabel: 'Under',             type: 'total',  votes: votes.under },
  ]
    .filter(c => c.votes.length >= 3)
    .sort((a, b) =>
      b.votes.length - a.votes.length ||
      (b.votes.reduce((s, v) => s + v.cushion, 0) / b.votes.length) -
      (a.votes.reduce((s, v) => s + v.cushion, 0) / a.votes.length)
    );

  if (!candidates.length) return null;
  const best = candidates[0];
  const avgCushion = best.votes.reduce((s, v) => s + v.cushion, 0) / best.votes.length;
  return {
    betLabel:   best.betLabel,
    count:      best.votes.length,
    avgCushion: avgCushion.toFixed(1),
    type:       best.type,
  };
}
// ──────────────────────────────────────────────────────────────────────────

function ValueBetInsight({ vb }) {
  if (!vb) return null;
  return (
    <div className="bms-value-insight">
      <span className={`bms-value-type bms-value-type-${vb.type}`}>
        {vb.type === 'spread' ? 'SPR' : 'TOT'}
      </span>
      <span className="bms-value-text">
        <strong>{vb.betLabel}</strong> — {vb.count}/5 models agree, avg {vb.avgCushion} pts vs line
      </span>
    </div>
  );
}

function ModelSummary({ modelData, betType, pick, topName }) {
  if (!modelData) return null;

  // Inject ensemble into modelData for display
  const dataWithEnsemble = { ...modelData, ensemble: computeEnsemble(modelData, topName) };

  const rows = BMS_MODELS.map(({ key, label, primary, ensemble: isEnsemble }) => {
    const m = dataWithEnsemble[key];
    if (!m) return null;

    let value = null;
    if (betType === 'ml') {
      const pct = Math.round((m.winProb ?? 0) * 100);
      value = `${m.predWinner}  ${pct}%`;
    } else if (betType === 'spread') {
      if (m.spread == null) return null;
      const sign = m.predWinner === pick ? '-' : '+';
      value = `${abbr(pick)} ${sign}${Math.abs(m.spread).toFixed(1)}`;
    } else {
      if (m.total == null) return null;
      value = `o/u ${m.total.toFixed(1)}`;
    }

    return { label, primary: !!primary, ensemble: !!isEnsemble, value, winner: m.predWinner };
  }).filter(Boolean);

  if (!rows.length) return null;

  return (
    <div className="betslip-model-summary">
      <div className="bms-header">Model Predictions</div>
      {rows.map(({ label, primary, ensemble, value, winner }) => (
        <div key={label} className={`bms-row${primary ? ' bms-row-primary' : ''}${ensemble ? ' bms-row-ensemble' : ''}`}>
          <span className="bms-tag">{label}</span>
          <span className="bms-winner">{winner}</span>
          <span className="bms-val">{value}</span>
        </div>
      ))}
    </div>
  );
}

function initSel(item) {
  const { id, topName, oddsData } = item;
  const hasML     = !!(oddsData?.moneyline?.[topName] || oddsData?.moneyline?.[item.botName]);
  const hasSpread = !!(oddsData?.spread?.[topName]    || oddsData?.spread?.[item.botName]);
  const hasTotal  = !!oddsData?.total;

  let betType = hasML ? 'ml' : hasSpread ? 'spread' : hasTotal ? 'ou' : 'ml';
  let pick = topName;
  if (betType === 'ou') pick = 'over';

  return { id, betType, pick, altSpread: '' };
}

export default function BetslipModal({ items, onClose }) {
  const [localItems, setLocalItems] = useState(items);
  const [sels, setSels] = useState(
    () => Object.fromEntries(items.map(item => [item.id, initSel(item)]))
  );

  function removeItem(id) {
    setLocalItems(prev => prev.filter(it => it.id !== id));
    setSels(prev => { const next = { ...prev }; delete next[id]; return next; });
  }

  function update(id, patch) {
    setSels(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function changeBetType(id, topName, betType) {
    const pick = betType === 'ou' ? 'over' : topName;
    update(id, { betType, pick, altSpread: '' });
  }

  function changePick(id, pick) {
    update(id, { pick, altSpread: '' });
  }

  function handleCreatePdf() {
    const betRows = localItems.map(item => {
      const sel = sels[item.id];
      const { topName, botName, oddsData } = item;
      let betDesc = '';
      if (sel.betType === 'ml') {
        betDesc = `${sel.pick} Moneyline`;
      } else if (sel.betType === 'spread') {
        const stdLine = oddsData?.spread?.[sel.pick]?.line ?? '';
        const line = sel.altSpread.trim() !== '' ? sel.altSpread.trim() : stdLine;
        betDesc = `${sel.pick} ${line}`;
      } else {
        const stdLine = oddsData?.total?.line ?? '';
        const line = sel.altTotal?.trim() ? sel.altTotal.trim() : stdLine;
        betDesc = `${sel.pick === 'over' ? 'Over' : 'Under'} ${line}`;
      }
      return { matchup: `${topName} vs ${botName}`, betDesc };
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Betslip — March Madness 2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 6px; }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 24px; }
    .bet { border: 1px solid #ddd; border-radius: 6px; padding: 14px 18px; margin-bottom: 12px; }
    .matchup { font-size: 11px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .bet-desc { font-size: 16px; font-weight: 700; }
    .footer { margin-top: 24px; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
    @media print {
      body { padding: 15px; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <h1>Betslip</h1>
  <div class="subtitle">March Madness 2026 · Generated ${new Date().toLocaleDateString()}</div>
  ${betRows.map(r => `
  <div class="bet">
    <div class="matchup">${r.matchup}</div>
    <div class="bet-desc">${r.betDesc}</div>
  </div>`).join('')}
  <div class="footer">Verify all lines with your sportsbook before placing bets.</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  }

  return (
    <div className="betslip-overlay" onClick={onClose}>
      <div className="betslip-modal" onClick={e => e.stopPropagation()}>

        <div className="betslip-modal-header">
          <span className="betslip-title">Betslip <span className="betslip-count">{localItems.length} bet{localItems.length !== 1 ? 's' : ''}</span></span>
          <button className="betslip-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="betslip-modal-body">
          {localItems.length === 0 && (
            <div className="betslip-empty">No bets in slip</div>
          )}
          {localItems.map(item => {
            const { id, topName, botName, oddsData, modelData } = item;
            const sel = sels[id];
            if (!sel) return null;
            const hasML     = !!(oddsData?.moneyline?.[topName] || oddsData?.moneyline?.[botName]);
            const hasSpread = !!(oddsData?.spread?.[topName]    || oddsData?.spread?.[botName]);
            const hasTotal  = !!oddsData?.total;
            const vb = modelData ? computeValueBet(modelData, oddsData, topName, botName) : null;

            return (
              <div key={id} className={`betslip-item${vb ? ' betslip-item-value' : ''}`}>
                <div className="betslip-item-header">
                  <span className="betslip-item-matchup">{topName} vs {botName}</span>
                  <button className="betslip-remove-btn" onClick={() => removeItem(id)} title="Remove">✕</button>
                </div>

                <ValueBetInsight vb={vb} />

                <div className="betslip-type-row">
                  {hasML && (
                    <button
                      className={`betslip-type-btn${sel.betType === 'ml' ? ' active' : ''}`}
                      onClick={() => changeBetType(id, topName, 'ml')}
                    >ML</button>
                  )}
                  {hasSpread && (
                    <button
                      className={`betslip-type-btn${sel.betType === 'spread' ? ' active' : ''}`}
                      onClick={() => changeBetType(id, topName, 'spread')}
                    >Spread</button>
                  )}
                  {hasTotal && (
                    <button
                      className={`betslip-type-btn${sel.betType === 'ou' ? ' active' : ''}`}
                      onClick={() => changeBetType(id, topName, 'ou')}
                    >O/U</button>
                  )}
                </div>

                <div className="betslip-options">
                  {sel.betType === 'ml' && [topName, botName].map(team => (
                    <label key={team} className={`betslip-option${sel.pick === team ? ' selected' : ''}`}>
                      <input type="radio" name={`ml-${id}`} checked={sel.pick === team} onChange={() => changePick(id, team)} />
                      <span className="option-team">{team}</span>
                      <span className="option-odds">{oddsData?.moneyline?.[team] ?? '—'}</span>
                    </label>
                  ))}
                  {sel.betType === 'spread' && [topName, botName].map(team => (
                    <label key={team} className={`betslip-option${sel.pick === team ? ' selected' : ''}`}>
                      <input type="radio" name={`spread-${id}`} checked={sel.pick === team} onChange={() => changePick(id, team)} />
                      <span className="option-team">{team}</span>
                      <span className="option-line">{oddsData?.spread?.[team]?.line ?? '—'}</span>
                      <span className="option-odds">{oddsData?.spread?.[team]?.odds ?? '—'}</span>
                    </label>
                  ))}
                  {sel.betType === 'ou' && ['over', 'under'].map(side => (
                    <label key={side} className={`betslip-option${sel.pick === side ? ' selected' : ''}`}>
                      <input type="radio" name={`ou-${id}`} checked={sel.pick === side} onChange={() => changePick(id, side)} />
                      <span className="option-team">{side === 'over' ? 'Over' : 'Under'} {oddsData?.total?.line}</span>
                      <span className="option-odds">{side === 'over' ? (oddsData?.total?.overOdds ?? '—') : (oddsData?.total?.underOdds ?? '—')}</span>
                    </label>
                  ))}
                </div>

                <ModelSummary modelData={modelData} betType={sel.betType} pick={sel.pick} topName={topName} />

                {sel.betType === 'spread' && (
                  <div className="betslip-odds-row">
                    <label className="betslip-odds-label">Alt Spread</label>
                    <input
                      className="betslip-odds-input"
                      type="text"
                      value={sel.altSpread}
                      onChange={e => update(id, { altSpread: e.target.value })}
                      placeholder={oddsData?.spread?.[sel.pick]?.line ?? 'e.g. -7.5'}
                    />
                  </div>
                )}
                {sel.betType === 'ou' && (
                  <div className="betslip-odds-row">
                    <label className="betslip-odds-label">Alt O/U</label>
                    <input
                      className="betslip-odds-input"
                      type="text"
                      value={sel.altTotal ?? ''}
                      onChange={e => update(id, { altTotal: e.target.value })}
                      placeholder={oddsData?.total?.line ?? 'e.g. 142.5'}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="betslip-modal-footer">
          <button className="betslip-pdf-btn" onClick={handleCreatePdf} disabled={localItems.length === 0}>
            ↓ Create PDF
          </button>
        </div>

      </div>
    </div>
  );
}
