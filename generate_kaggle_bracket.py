"""
generate_kaggle_bracket.py
Simulates the 2026 March Madness bracket using the Kaggle model pipeline.
Run:  uv run python generate_kaggle_bracket.py
Out:  bracket_kaggle_visualization.html
"""
import os, warnings
import numpy as np
import pandas as pd
import joblib
import statsmodels.api as sm
import xgboost as xgb

warnings.filterwarnings('ignore')

BASE      = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'model')
DATA_DIR  = os.path.join(BASE, 'data_2026')
OUT_FILE  = os.path.join(BASE, 'bracket_kaggle_visualization.html')

# ─── Load models ─────────────────────────────────────────────────────────────────
print("Loading models...")
bundle  = joblib.load(os.path.join(MODEL_DIR, 'kaggle_proba.joblib'))
LOSO    = bundle['models']
SPLINE  = bundle['spline']
T_LIM   = bundle['t']
SP_MDL  = joblib.load(os.path.join(MODEL_DIR, 'kaggle_spread.joblib'))
TOT_MDL = joblib.load(os.path.join(MODEL_DIR, 'kaggle_total.joblib'))

KFEATS = [
    "men_women","T1_seed","T2_seed","Seed_diff",
    "T1_avg_Score","T1_avg_FGA","T1_avg_OR","T1_avg_DR","T1_avg_Blk","T1_avg_PF",
    "T1_avg_opponent_FGA","T1_avg_opponent_Blk","T1_avg_opponent_PF","T1_avg_PointDiff",
    "T2_avg_Score","T2_avg_FGA","T2_avg_OR","T2_avg_DR","T2_avg_Blk","T2_avg_PF",
    "T2_avg_opponent_FGA","T2_avg_opponent_Blk","T2_avg_opponent_PF","T2_avg_PointDiff",
    "T1_elo","T2_elo","elo_diff","T1_quality","T2_quality",
]

# ─── Kaggle feature computation ───────────────────────────────────────────────────
def prepare_df(df):
    cols = ["Season","DayNum","LTeamID","LScore","WTeamID","WScore","NumOT",
            "LFGM","LFGA","LFGM3","LFGA3","LFTM","LFTA","LOR","LDR","LAst","LTO","LStl","LBlk","LPF",
            "WFGM","WFGA","WFGM3","WFGA3","WFTM","WFTA","WOR","WDR","WAst","WTO","WStl","WBlk","WPF"]
    df = df[cols].copy()
    adj = (40 + 5*df["NumOT"]) / 40
    for c in [x for x in cols if x not in ["Season","DayNum","LTeamID","WTeamID","NumOT"]]:
        df[c] = df[c] / adj
    sw = df.copy()
    df.columns = [x.replace("W","T1_").replace("L","T2_") for x in df.columns]
    sw.columns = [x.replace("L","T1_").replace("W","T2_") for x in sw.columns]
    out = pd.concat([df, sw]).reset_index(drop=True)
    out["PointDiff"] = out["T1_Score"] - out["T2_Score"]
    out["win"] = (out["PointDiff"] > 0).astype(int)
    return out

def compute_kf(csv_path):
    raw = pd.read_csv(csv_path)
    raw = raw[raw.Season == 2026]
    if not len(raw): return {}
    reg = prepare_df(raw)
    BCOLS = [
        "T1_Score","T1_FGM","T1_FGA","T1_FGM3","T1_FGA3","T1_FTM","T1_FTA",
        "T1_OR","T1_DR","T1_Ast","T1_TO","T1_Stl","T1_Blk","T1_PF",
        "T2_Score","T2_FGM","T2_FGA","T2_FGM3","T2_FGA3","T2_FTM","T2_FTA",
        "T2_OR","T2_DR","T2_Ast","T2_TO","T2_Stl","T2_Blk","T2_PF","PointDiff"]
    ss = reg.groupby("T1_TeamID")[BCOLS].mean()
    ss.columns = [x.replace("T1_","avg_").replace("T2_","avg_opponent_") for x in ss.columns]
    base, width, k = 1000, 400, 100
    wins = reg[reg.win == 1].reset_index(drop=True)
    elo  = dict.fromkeys(set(wins.T1_TeamID) | set(wins.T2_TeamID), base)
    for i in range(len(wins)):
        w2, l = wins.loc[i,"T1_TeamID"], wins.loc[i,"T2_TeamID"]
        e = 1/(1+10**((elo[l]-elo[w2])/width)); c = k*(1-e); elo[w2]+=c; elo[l]-=c
    dt = reg.copy(); dt["T1_TeamID"] = dt["T1_TeamID"].astype(str); dt["T2_TeamID"] = dt["T2_TeamID"].astype(str)
    try:
        glm = sm.GLM.from_formula("PointDiff~-1+T1_TeamID+T2_TeamID", data=dt,
                                   family=sm.families.Gaussian()).fit()
        q = pd.DataFrame(glm.params).reset_index(); q.columns = ["p","quality"]
        q = q[q.p.str.contains("T1_")].copy()
        q["TeamID"] = q["p"].apply(lambda x: x[10:14]).astype(int)
        qs = q.set_index("TeamID")["quality"]
    except:
        qs = pd.Series(dtype=float)
    res = {}
    for tid in set(ss.index) | set(elo.keys()):
        f = dict(ss.loc[tid]) if tid in ss.index else {c: float(ss[c].median()) for c in ss.columns}
        f['elo']     = elo.get(tid, base)
        f['quality'] = float(qs.get(tid, qs.median() if len(qs) else 0.0))
        res[tid] = f
    return res

print("Computing 2026 Kaggle features (~30s for Men's GLM)...")
KF_M = compute_kf(os.path.join(DATA_DIR, 'MRegularSeasonDetailedResults.csv'))
KF_W = compute_kf(os.path.join(DATA_DIR, 'WRegularSeasonDetailedResults.csv'))
print(f"  M:{len(KF_M)} W:{len(KF_W)}")

# ─── Name maps ───────────────────────────────────────────────────────────────────
def build_nm(path, extra={}):
    df = pd.read_csv(path)
    d  = dict(zip(df.TeamNameSpelling.str.lower(), df.TeamID))
    d.update(extra); return d

MNM = build_nm(os.path.join(DATA_DIR, 'MTeamSpellings.csv'), {
    "st john's": 1385, 'n iowa': 1320, 's florida': 1378, 'n carolina': 1314,
    'prairie view': 1341, 'miami oh': 1278, 'liu brooklyn': 1257,
    'n dakota st': 1303, 'mcneese st': 1271, 'wright st': 1459,
    'santa clara': 1360, 'tennessee st': 1401, 'queens nc': 1347, 'kennesaw': 1236,
})
WNM = build_nm(os.path.join(DATA_DIR, 'WTeamSpellings.csv'), {
    'n carolina': 3314, 's carolina': 3376, 'w virginia': 3452, 'high point': 3219,
    'sf austin': 3372, 'southern univ': 3380, 's univ': 3380, 'missouri st': 3295,
    'f dickinson': 3179, 'wi green bay': 3457, 'col charleston': 3127,
    'uc san diego': 3411, 'james madison': 3228, 's dakota st': 3357,
    'ut san antonio': 3417, 'rhode island': 3343, 'holy cross': 3222,
    'cal baptist': 3117, 'jacksonville': 3231, 'w illinois': 3447,
    'murray st': 3302, 'virginia tech': 3439, 'arizona st': 3109, 'richmond': 3344,
    'nebraska': 3304, 'virginia': 3438,
})

# ─── Predict one game ─────────────────────────────────────────────────────────────
def predict(name1, seed1, name2, seed2, kf, nm, mw):
    c1, c2 = name1.rstrip('*'), name2.rstrip('*')
    i1 = nm.get(c1.lower()); i2 = nm.get(c2.lower())
    if not kf:
        return dict(t1=c1, s1=seed1, t2=c2, s2=seed2, winner=c1, ws=seed1,
                    loser=c2, ls=seed2, spread=0, total=0, prob=0.5)
    med = {k: float(np.median([v[k] for v in kf.values()])) for k in next(iter(kf.values()))}
    t1f = kf.get(i1, med) if i1 else med
    t2f = kf.get(i2, med) if i2 else med
    row = {'men_women': mw, 'T1_seed': seed1, 'T2_seed': seed2,
           'Seed_diff': seed2 - seed1,
           'elo_diff': t1f.get('elo', 1000) - t2f.get('elo', 1000)}
    for k, v in t1f.items(): row[f'T1_{k}'] = v
    for k, v in t2f.items(): row[f'T2_{k}'] = v
    df  = pd.DataFrame([row])
    dm  = xgb.DMatrix(df.reindex(columns=KFEATS, fill_value=0).values)
    marg = float(np.array([LOSO[s].predict(dm) for s in sorted(LOSO)]).mean())
    wp   = float(np.clip(SPLINE(np.clip([marg], -T_LIM, T_LIM)), 0.01, 0.99)[0])
    if wp >= 0.5: winner, ws, loser, ls, disp = c1, seed1, c2, seed2, wp
    else:         winner, ws, loser, ls, disp = c2, seed2, c1, seed1, 1 - wp
    Xk   = df.reindex(columns=SP_MDL.feature_names_in_, fill_value=0)
    sprd = round(abs(float(SP_MDL.predict(Xk)[0])), 1)
    tot  = round(float(TOT_MDL.predict(Xk)[0]), 1)
    return dict(t1=c1, s1=seed1, t2=c2, s2=seed2, winner=winner, ws=ws,
                loser=loser, ls=ls, spread=sprd, total=tot, prob=round(disp, 3))

# ─── Bracket definitions ─────────────────────────────────────────────────────────
# Play-in: (t1, s1, t2, s2, region, seed_slot)
M_PLAYIN = [
    ('Lehigh', 16, 'Prairie View', 16, 'X', 16),
    ('Miami OH', 11, 'SMU', 11, 'Y', 11),
    ('Howard', 16, 'UMBC', 16, 'Y', 16),
    ('NC State', 11, 'Texas', 11, 'Z', 11),
]
W_PLAYIN = [
    ('Arizona St', 10, 'Virginia', 10, 'X', 10),
    ('Samford', 16, 'Southern Univ', 16, 'X', 16),
    ('Missouri St', 16, 'SF Austin', 16, 'Y', 16),
    ('Nebraska', 11, 'Richmond', 11, 'Z', 11),
]

# R64 slots per region in game order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
# '*' = play-in winner (resolved by region+seed lookup)
M_R64 = {
    'W': [('Duke',1,'Siena',16),('Ohio St',8,'TCU',9),("St John's",5,'N Iowa',12),('Kansas',4,'Cal Baptist',13),
          ('Louisville',6,'S Florida',11),('Michigan St',3,'N Dakota St',14),('UCLA',7,'UCF',10),('Connecticut',2,'Furman',15)],
    'X': [('Florida',1,'Lehigh*',16),('Clemson',8,'Iowa',9),('Vanderbilt',5,'McNeese St',12),('Nebraska',4,'Troy',13),
          ('N Carolina',6,'VCU',11),('Illinois',3,'Penn',14),("St Mary's CA",7,'Texas A&M',10),('Houston',2,'Idaho',15)],
    'Y': [('Michigan',1,'UMBC*',16),('Georgia',8,'St Louis',9),('Texas Tech',5,'Akron',12),('Alabama',4,'Hofstra',13),
          ('Tennessee',6,'SMU*',11),('Virginia',3,'Wright St',14),('Kentucky',7,'Santa Clara',10),('Iowa St',2,'Tennessee St',15)],
    'Z': [('Arizona',1,'LIU Brooklyn',16),('Villanova',8,'Utah St',9),('Wisconsin',5,'High Point',12),('Arkansas',4,'Hawaii',13),
          ('BYU',6,'NC State*',11),('Gonzaga',3,'Kennesaw',14),('Miami FL',7,'Missouri',10),('Purdue',2,'Queens NC',15)],
}
W_R64 = {
    'W': [('Connecticut',1,'UT San Antonio',16),('Iowa St',8,'Syracuse',9),('Maryland',5,'Murray St',12),('N Carolina',4,'W Illinois',13),
          ('Notre Dame',6,'Fairfield',11),('Ohio St',3,'Howard',14),('Illinois',7,'Colorado',10),('Vanderbilt',2,'High Point',15)],
    'X': [('S Carolina',1,'S Univ*',16),('Clemson',8,'USC',9),('Michigan St',5,'Colorado St',12),('Oklahoma',4,'Idaho',13),
          ('Washington',6,'S Dakota St',11),('TCU',3,'UC San Diego',14),('Georgia',7,'Virginia*',10),('Iowa',2,'F Dickinson',15)],
    'Y': [('Texas',1,'SF Austin*',16),('Oregon',8,'Virginia Tech',9),('Kentucky',5,'James Madison',12),('W Virginia',4,'Miami OH',13),
          ('Alabama',6,'Rhode Island',11),('Louisville',3,'Vermont',14),('NC State',7,'Tennessee',10),('Michigan',2,'Holy Cross',15)],
    'Z': [('UCLA',1,'Cal Baptist',16),('Oklahoma St',8,'Princeton',9),('Mississippi',5,'Gonzaga',12),('Minnesota',4,'WI Green Bay',13),
          ('Baylor',6,'Nebraska*',11),('Duke',3,'Col Charleston',14),('Texas Tech',7,'Villanova',10),('LSU',2,'Jacksonville',15)],
}

# ─── Simulate ─────────────────────────────────────────────────────────────────────
def sim_playin(playin_defs, kf, nm, mw):
    winners = {}   # (region, slot) -> (winner_name, seed)
    results = []
    for t1, s1, t2, s2, region, slot in playin_defs:
        g = predict(t1, s1, t2, s2, kf, nm, mw)
        winners[(region, slot)] = (g['winner'], g['ws'])
        results.append(dict(region=region, slot=slot, **g))
    return winners, results

def apply_playin(r64_by_region, playin_winners):
    result = {}
    for region, games in r64_by_region.items():
        new_games = []
        for t1, s1, t2, s2 in games:
            if t1.endswith('*'):
                pw, ps = playin_winners.get((region, s1), (t1.rstrip('*'), s1))
                t1 = pw
            if t2.endswith('*'):
                pw, ps = playin_winners.get((region, s2), (t2.rstrip('*'), s2))
                t2 = pw
            new_games.append((t1, s1, t2, s2))
        result[region] = new_games
    return result

def sim_region(r64_slots, kf, nm, mw):
    r64 = [predict(t1,s1,t2,s2,kf,nm,mw) for t1,s1,t2,s2 in r64_slots]
    r32 = [predict(r64[i*2]['winner'], r64[i*2]['ws'], r64[i*2+1]['winner'], r64[i*2+1]['ws'], kf, nm, mw) for i in range(4)]
    s16 = [predict(r32[i*2]['winner'], r32[i*2]['ws'], r32[i*2+1]['winner'], r32[i*2+1]['ws'], kf, nm, mw) for i in range(2)]
    e8  = [predict(s16[0]['winner'], s16[0]['ws'], s16[1]['winner'], s16[1]['ws'], kf, nm, mw)]
    return r64, r32, s16, e8

# ─── Run simulation ───────────────────────────────────────────────────────────────
print("\nSimulating Men's bracket...")
m_pi_winners, m_pi_results = sim_playin(M_PLAYIN, KF_M, MNM, 1)
m_r64_final = apply_playin(M_R64, m_pi_winners)
M = {}
for reg in ['W','X','Y','Z']:
    M[reg] = sim_region(m_r64_final[reg], KF_M, MNM, 1)
    e8w = M[reg][3][0]['winner']; e8s = M[reg][3][0]['ws']
    print(f"  {reg}: {e8w} (seed {e8s})")

m_ff1 = predict(M['W'][3][0]['winner'], M['W'][3][0]['ws'], M['X'][3][0]['winner'], M['X'][3][0]['ws'], KF_M, MNM, 1)
m_ff2 = predict(M['Y'][3][0]['winner'], M['Y'][3][0]['ws'], M['Z'][3][0]['winner'], M['Z'][3][0]['ws'], KF_M, MNM, 1)
m_champ = predict(m_ff1['winner'], m_ff1['ws'], m_ff2['winner'], m_ff2['ws'], KF_M, MNM, 1)
print(f"  FF: {m_ff1['winner']} vs {m_ff2['winner']} -> Champion: {m_champ['winner']} (seed {m_champ['ws']})")

print("\nSimulating Women's bracket...")
w_pi_winners, w_pi_results = sim_playin(W_PLAYIN, KF_W, WNM, 0)
w_r64_final = apply_playin(W_R64, w_pi_winners)
W = {}
for reg in ['W','X','Y','Z']:
    W[reg] = sim_region(w_r64_final[reg], KF_W, WNM, 0)
    e8w = W[reg][3][0]['winner']; e8s = W[reg][3][0]['ws']
    print(f"  {reg}: {e8w} (seed {e8s})")

w_ff1 = predict(W['W'][3][0]['winner'], W['W'][3][0]['ws'], W['X'][3][0]['winner'], W['X'][3][0]['ws'], KF_W, WNM, 0)
w_ff2 = predict(W['Y'][3][0]['winner'], W['Y'][3][0]['ws'], W['Z'][3][0]['winner'], W['Z'][3][0]['ws'], KF_W, WNM, 0)
w_champ = predict(w_ff1['winner'], w_ff1['ws'], w_ff2['winner'], w_ff2['ws'], KF_W, WNM, 0)
print(f"  FF: {w_ff1['winner']} vs {w_ff2['winner']} -> Champion: {w_champ['winner']} (seed {w_champ['ws']})")

# ─── HTML generation ──────────────────────────────────────────────────────────────
def gh(g):
    c1 = 'win' if g['t1'] == g['winner'] else 'loss'
    c2 = 'win' if g['t2'] == g['winner'] else 'loss'
    return (f'<div class="game">'
            f'<div class="team {c1}"><span class="seed">{g["s1"]}</span>{g["t1"]}</div>'
            f'<div class="team {c2}"><span class="seed">{g["s2"]}</span>{g["t2"]}</div>'
            f'</div>\n')

def region_left(name, r64, r32, s16, e8):
    return f"""    <div class="region">
      <div class="region-name">{name}</div>
      <div class="rounds">
        <div class="round-col"><div class="rnd-label">ROUND OF 64</div>{''.join(gh(g) for g in r64)}</div>
        <div class="round-col r32-col"><div class="rnd-label">ROUND OF 32</div>{''.join(gh(g) for g in r32)}</div>
        <div class="round-col s16-col"><div class="rnd-label">SWEET 16</div>{''.join(gh(g) for g in s16)}</div>
        <div class="round-col e8-col"><div class="rnd-label">ELITE 8</div>{gh(e8[0])}</div>
      </div>
    </div>"""

def region_right(name, r64, r32, s16, e8):
    return f"""    <div class="region">
      <div class="region-name">{name}</div>
      <div class="rounds">
        <div class="round-col e8-col"><div class="rnd-label">ELITE 8</div>{gh(e8[0])}</div>
        <div class="round-col s16-col"><div class="rnd-label">SWEET 16</div>{''.join(gh(g) for g in s16)}</div>
        <div class="round-col r32-col"><div class="rnd-label">ROUND OF 32</div>{''.join(gh(g) for g in r32)}</div>
        <div class="round-col"><div class="rnd-label">ROUND OF 64</div>{''.join(gh(g) for g in r64)}</div>
      </div>
    </div>"""

def ff_team(g, team_name, seed, region_label, is_winner):
    cls = 'win' if is_winner else 'loss'
    return f'<div class="ff-team {cls}"><span class="seed">{seed}</span>{team_name} ({region_label})</div>'

def center_html(ff1, ff2, champ, gender_label):
    r1w = ff1['t1'] == ff1['winner']
    r2w = ff1['t2'] == ff1['winner']
    r3w = ff2['t1'] == ff2['winner']
    r4w = ff2['t2'] == ff2['winner']
    cw1 = champ['t1'] == champ['winner']
    cw2 = champ['t2'] == champ['winner']
    return f"""  <div class="center">
    <div class="ff-box">
      <h3>FINAL FOUR</h3>
      <div class="ff-game">
        <div class="ff-team {'win' if r1w else 'loss'}"><span class="seed">{ff1['s1']}</span>{ff1['t1']} (W)</div>
        <div class="ff-team {'win' if r2w else 'loss'}"><span class="seed">{ff1['s2']}</span>{ff1['t2']} (X)</div>
      </div>
      <div class="ff-game">
        <div class="ff-team {'win' if r3w else 'loss'}"><span class="seed">{ff2['s1']}</span>{ff2['t1']} (Y)</div>
        <div class="ff-team {'win' if r4w else 'loss'}"><span class="seed">{ff2['s2']}</span>{ff2['t2']} (Z)</div>
      </div>
    </div>
    <div class="champ-box">
      <div class="trophy">🏆</div>
      <h3>CHAMPIONSHIP</h3>
      <div class="ff-game">
        <div class="ff-team {'win' if cw1 else 'loss'}"><span class="seed">{champ['s1']}</span>{champ['t1']}</div>
        <div class="ff-team {'win' if cw2 else 'loss'}"><span class="seed">{champ['s2']}</span>{champ['t2']}</div>
      </div>
      <div class="champ-name">{champ['winner'].upper()}</div>
      <div class="champ-detail">2026 {gender_label} Champion</div>
    </div>
  </div>"""

def playin_section(pi_results):
    items = ''.join(
        f'<div class="playin-game"><span class="pi-label">{g["region"]}{g["slot"]}:</span>'
        f'<span class="pi-w">{g["winner"]}</span> def. <span class="pi-l">{g["loser"]}</span></div>'
        for g in pi_results
    )
    return f'<div class="playin" style="margin-bottom:14px;"><h3>PLAY-IN GAMES (First Four)</h3><div class="playin-games">{items}</div></div>'

# ─── Assemble HTML ────────────────────────────────────────────────────────────────
CSS = """* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 16px; }
h1 { color: #58a6ff; text-align: center; font-size: 1.8em; margin-bottom: 4px; }
h2 { color: #f0a500; text-align: center; font-size: 1.4em; margin: 28px 0 10px; border-bottom: 2px solid #f0a500; padding-bottom: 6px; }
.subtitle { text-align: center; color: #8b949e; font-size: 0.85em; margin-bottom: 20px; }
.playin { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; max-width: 1400px; margin-left: auto; margin-right: auto; }
.playin h3 { color: #79c0ff; font-size: 0.9em; margin-bottom: 8px; }
.playin-games { display: flex; flex-wrap: wrap; gap: 10px; }
.playin-game { background: #0d1117; border: 1px solid #30363d; border-radius: 4px; padding: 6px 10px; font-size: 0.8em; }
.pi-w { color: #58a6ff; font-weight: bold; }
.pi-l { color: #484f58; text-decoration: line-through; }
.pi-label { color: #8b949e; font-size: 0.85em; margin-right: 4px; }
.bracket-wrap { display: grid; grid-template-columns: 1fr 180px 1fr; gap: 8px; max-width: 1400px; margin: 0 auto; align-items: start; }
.left-side, .right-side { display: flex; flex-direction: column; gap: 8px; }
.region { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px; }
.region-name { color: #f0a500; font-size: 0.8em; font-weight: bold; text-align: center; margin-bottom: 6px; letter-spacing: 1px; }
.rounds { display: flex; flex-direction: row; gap: 2px; align-items: flex-start; }
.round-col { display: flex; flex-direction: column; min-width: 112px; max-width: 120px; }
.rnd-label { font-size: 0.62em; color: #8b949e; text-align: center; padding: 2px; border-bottom: 1px solid #21262d; margin-bottom: 3px; }
.game { display: flex; flex-direction: column; margin-bottom: 0; }
.team { display: flex; align-items: center; padding: 2px 5px; font-size: 0.72em; border: 1px solid #21262d; background: #0d1117; height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.team:first-child { border-bottom: none; }
.seed { color: #8b949e; font-size: 0.8em; min-width: 14px; display: inline-block; margin-right: 3px; }
.team.win { background: #0a2a0a; border-color: #2ea043; color: #e6edf3; font-weight: bold; }
.team.win .seed { color: #56d364; }
.team.loss { color: #3d444d; }
.team.loss .seed { color: #3d444d; }
.r32-col .game:not(:first-child) { margin-top: 24px; }
.r32-col .game:first-child { margin-top: 12px; }
.s16-col .game:not(:first-child) { margin-top: 72px; }
.s16-col .game:first-child { margin-top: 60px; }
.e8-col .game { margin-top: 180px; }
.right-side .r32-col .game:not(:first-child) { margin-top: 24px; }
.right-side .r32-col .game:first-child { margin-top: 12px; }
.right-side .s16-col .game:not(:first-child) { margin-top: 72px; }
.right-side .s16-col .game:first-child { margin-top: 60px; }
.right-side .e8-col .game { margin-top: 180px; }
.center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding-top: 20px; }
.ff-box, .champ-box { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 10px 14px; width: 180px; }
.champ-box { border-color: #f0a500; }
.ff-box h3 { color: #79c0ff; font-size: 0.8em; margin-bottom: 8px; text-align: center; }
.champ-box h3 { color: #f0a500; font-size: 0.8em; margin-bottom: 8px; text-align: center; }
.ff-game { margin-bottom: 10px; }
.ff-game:last-child { margin-bottom: 0; }
.ff-team { display: flex; align-items: center; padding: 4px 6px; background: #0d1117; border: 1px solid #21262d; font-size: 0.8em; height: 28px; }
.ff-team:first-child { border-bottom: none; }
.ff-team.win { background: #0a2a0a; border-color: #2ea043; color: #e6edf3; font-weight: bold; }
.ff-team.loss { color: #3d444d; }
.champ-name { text-align: center; font-size: 1.3em; font-weight: bold; color: #f0a500; padding: 8px 0 4px; }
.champ-detail { text-align: center; font-size: 0.72em; color: #8b949e; }
.trophy { text-align: center; font-size: 2em; margin-bottom: 4px; }
.note { color: #f85149; font-size: 0.7em; font-style: italic; margin-top: 4px; text-align: center; }
.accuracy { text-align: center; color: #8b949e; font-size: 0.8em; margin-bottom: 10px; }
.kaggle-badge { display: inline-block; background: #1a3a1a; border: 1px solid #2ea043; color: #56d364; border-radius: 4px; padding: 2px 8px; font-size: 0.8em; margin-left: 8px; }"""

m_pi_html = playin_section(m_pi_results)
w_pi_html = playin_section(w_pi_results)

m_region_names = {'W': 'EAST REGION', 'X': 'SOUTH REGION', 'Y': 'MIDWEST REGION', 'Z': 'WEST REGION'}
w_region_names = {'W': 'W REGION', 'X': 'X REGION', 'Y': 'Y REGION', 'Z': 'Z REGION'}

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>March Madness 2026 — Kaggle Model Bracket</title>
<style>
{CSS}
</style>
</head>
<body>

<h1>🏀 March Madness 2026 Bracket Predictions</h1>
<p class="subtitle">Kaggle Pipeline <span class="kaggle-badge">Best Model · 80.04% win accuracy</span></p>
<p class="subtitle" style="margin-top:-12px;">LOSO XGBoost + ELO + GLM quality + spline calibration · 29 features</p>

<!-- ===== MEN'S BRACKET ===== -->
<h2>MEN'S TOURNAMENT</h2>
<p class="accuracy">Win accuracy: <strong>80.04%</strong> · Spread MAE: 8.26 pts · Total MAE: 10.79 pts &nbsp;(2024–2025 test seasons)</p>

{m_pi_html}

<div class="bracket-wrap">
  <div class="left-side">
{region_left(m_region_names['W'], *M['W'])}
{region_left(m_region_names['Y'], *M['Y'])}
  </div>
{center_html(m_ff1, m_ff2, m_champ, "Men's")}
  <div class="right-side">
{region_right(m_region_names['X'], *M['X'])}
{region_right(m_region_names['Z'], *M['Z'])}
  </div>
</div>

<!-- ===== WOMEN'S BRACKET ===== -->
<h2>WOMEN'S TOURNAMENT</h2>
<p class="accuracy">Win accuracy: <strong>80.04%</strong> · Spread MAE: 8.26 pts · Total MAE: 10.79 pts &nbsp;(2024–2025 test seasons)</p>

{w_pi_html}

<div class="bracket-wrap">
  <div class="left-side">
{region_left(w_region_names['W'], *W['W'])}
{region_left(w_region_names['Y'], *W['Y'])}
  </div>
{center_html(w_ff1, w_ff2, w_champ, "Women's")}
  <div class="right-side">
{region_right(w_region_names['X'], *W['X'])}
{region_right(w_region_names['Z'], *W['Z'])}
  </div>
</div>

<p style="text-align:center;color:#484f58;font-size:0.75em;margin-top:20px;">
  * = Play-in winner &nbsp;|&nbsp; <span style="color:#56d364;font-weight:bold;">Green = predicted winner</span> &nbsp;|&nbsp;
  Kaggle model: LOSO XGBoost, spline-calibrated, ELO + GLM quality features
</p>

</body>
</html>"""

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nSaved: {OUT_FILE}")
print(f"Men's champion: {m_champ['winner']} (seed {m_champ['ws']})")
print(f"Women's champion: {w_champ['winner']} (seed {w_champ['ws']})")