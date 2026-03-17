import { useState } from 'react';

function abbr(name) {
  if (!name) return '?';
  return name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
}

function ModelSummary({ modelData, betType, pick }) {
  if (!modelData) return null;
  const { seeded, noSeed } = modelData;

  function mlLine(m) {
    if (!m) return null;
    const pct = Math.round(m.winProb * 100);
    return `${m.predWinner} ${pct}%`;
  }
  function spreadLine(m, pickTeam) {
    if (!m || m.spread == null) return null;
    // spread is from the predicted winner's perspective (negative = fav)
    const favSign = m.predWinner === pickTeam ? '-' : '+';
    return `${abbr(pickTeam)}: ${favSign}${Math.abs(m.spread).toFixed(1)}`;
  }
  function totalLine(m) {
    if (!m || m.total == null) return null;
    return `o/u ${m.total.toFixed(1)}`;
  }

  let s = null, ns = null;
  if (betType === 'ml') {
    s  = mlLine(seeded);
    ns = mlLine(noSeed);
  } else if (betType === 'spread') {
    s  = spreadLine(seeded,  pick);
    ns = spreadLine(noSeed,  pick);
  } else {
    s  = totalLine(seeded);
    ns = totalLine(noSeed);
  }

  if (!s && !ns) return null;

  return (
    <div className="betslip-model-summary">
      <span className="bms-label">Model</span>
      {s  && <span className="bms-val"><span className="bms-tag">S</span>{s}</span>}
      {ns && <span className="bms-val"><span className="bms-tag">NS</span>{ns}</span>}
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
  const [sels, setSels] = useState(() => items.map(initSel));

  function update(i, patch) {
    setSels(prev => prev.map((s, j) => j === i ? { ...s, ...patch } : s));
  }

  function changeBetType(i, betType) {
    const { topName } = items[i];
    const pick = betType === 'ou' ? 'over' : topName;
    update(i, { betType, pick, altSpread: '' });
  }

  function changePick(i, pick) {
    update(i, { pick, altSpread: '' });
  }

  function handleCreatePdf() {
    const betRows = sels.map((sel, i) => {
      const { topName, botName, oddsData } = items[i];
      let betDesc = '';
      if (sel.betType === 'ml') {
        betDesc = `${sel.pick} Moneyline`;
      } else if (sel.betType === 'spread') {
        const stdLine = oddsData?.spread?.[sel.pick]?.line ?? '';
        const line = sel.altSpread.trim() !== '' ? sel.altSpread.trim() : stdLine;
        betDesc = `${sel.pick} ${line}`;
      } else {
        const line = oddsData?.total?.line ?? '';
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
          <span className="betslip-title">Betslip <span className="betslip-count">{items.length} bet{items.length !== 1 ? 's' : ''}</span></span>
          <button className="betslip-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="betslip-modal-body">
          {items.map((item, i) => {
            const sel = sels[i];
            const { topName, botName, oddsData, modelData } = item;
            const hasML     = !!(oddsData?.moneyline?.[topName] || oddsData?.moneyline?.[botName]);
            const hasSpread = !!(oddsData?.spread?.[topName]    || oddsData?.spread?.[botName]);
            const hasTotal  = !!oddsData?.total;

            return (
              <div key={sel.id} className="betslip-item">
                <div className="betslip-item-matchup">{topName} vs {botName}</div>

                <div className="betslip-type-row">
                  {hasML && (
                    <button
                      className={`betslip-type-btn${sel.betType === 'ml' ? ' active' : ''}`}
                      onClick={() => changeBetType(i, 'ml')}
                    >ML</button>
                  )}
                  {hasSpread && (
                    <button
                      className={`betslip-type-btn${sel.betType === 'spread' ? ' active' : ''}`}
                      onClick={() => changeBetType(i, 'spread')}
                    >Spread</button>
                  )}
                  {hasTotal && (
                    <button
                      className={`betslip-type-btn${sel.betType === 'ou' ? ' active' : ''}`}
                      onClick={() => changeBetType(i, 'ou')}
                    >O/U</button>
                  )}
                </div>

                <div className="betslip-options">
                  {sel.betType === 'ml' && [topName, botName].map(team => (
                    <label key={team} className={`betslip-option${sel.pick === team ? ' selected' : ''}`}>
                      <input type="radio" name={`ml-${sel.id}`} checked={sel.pick === team} onChange={() => changePick(i, team)} />
                      <span className="option-team">{team}</span>
                      <span className="option-odds">{oddsData?.moneyline?.[team] ?? '—'}</span>
                    </label>
                  ))}
                  {sel.betType === 'spread' && [topName, botName].map(team => (
                    <label key={team} className={`betslip-option${sel.pick === team ? ' selected' : ''}`}>
                      <input type="radio" name={`spread-${sel.id}`} checked={sel.pick === team} onChange={() => changePick(i, team)} />
                      <span className="option-team">{team}</span>
                      <span className="option-line">{oddsData?.spread?.[team]?.line ?? '—'}</span>
                      <span className="option-odds">{oddsData?.spread?.[team]?.odds ?? '—'}</span>
                    </label>
                  ))}
                  {sel.betType === 'ou' && ['over', 'under'].map(side => (
                    <label key={side} className={`betslip-option${sel.pick === side ? ' selected' : ''}`}>
                      <input type="radio" name={`ou-${sel.id}`} checked={sel.pick === side} onChange={() => changePick(i, side)} />
                      <span className="option-team">{side === 'over' ? 'Over' : 'Under'} {oddsData?.total?.line}</span>
                      <span className="option-odds">{side === 'over' ? (oddsData?.total?.overOdds ?? '—') : (oddsData?.total?.underOdds ?? '—')}</span>
                    </label>
                  ))}
                </div>

                <ModelSummary modelData={modelData} betType={sel.betType} pick={sel.pick} />

                {sel.betType === 'spread' && (
                  <div className="betslip-odds-row">
                    <label className="betslip-odds-label">Alt Spread</label>
                    <input
                      className="betslip-odds-input"
                      type="text"
                      value={sel.altSpread}
                      onChange={e => update(i, { altSpread: e.target.value })}
                      placeholder={oddsData?.spread?.[sel.pick]?.line ?? 'e.g. -7.5'}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="betslip-modal-footer">
          <button className="betslip-pdf-btn" onClick={handleCreatePdf}>
            ↓ Create PDF
          </button>
        </div>

      </div>
    </div>
  );
}
