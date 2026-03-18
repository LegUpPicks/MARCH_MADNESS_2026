"""
Pre-compute predictions for every possible 2026 tournament team pair.
Outputs allMatchupPredictions.json, keyed by "m:TeamA|TeamB" (alphabetical names).

The React app looks up any dynamic matchup by team names + round — no model needed at runtime.
Per-round models are saved to model/round_models_M.joblib and model/round_models_W.joblib.
"""
import json, os, warnings
import numpy as np
import pandas as pd
import joblib
import statsmodels.api as sm
import xgboost as xgb
from itertools import combinations
from xgboost import XGBClassifier, XGBRegressor

warnings.filterwarnings('ignore')

BASE      = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'model')
DATA_DIR  = os.path.join(BASE, 'data_2026')
OUT_FILE  = os.path.join(BASE, 'march-madness-tracker', 'src', 'data', 'allMatchupPredictions.json')

# ═══════════════════════════════════════════════════════════════
# LOAD MODELS
# ═══════════════════════════════════════════════════════════════
print("Loading saved models...")
M_MODELS = {
    'clf':      joblib.load(os.path.join(MODEL_DIR, 'march_madness_model.joblib')),
    'clf_ns':   joblib.load(os.path.join(MODEL_DIR, 'march_madness_model_no_seed.joblib')),
    'spread':   joblib.load(os.path.join(MODEL_DIR, 'spread_model.joblib')),
    'spread_ns':joblib.load(os.path.join(MODEL_DIR, 'spread_model_no_seed.joblib')),
    'total':    joblib.load(os.path.join(MODEL_DIR, 'total_model.joblib')),
    'total_ns': joblib.load(os.path.join(MODEL_DIR, 'total_model_no_seed.joblib')),
}
W_MODELS = {
    'clf':      joblib.load(os.path.join(MODEL_DIR, 'march_madness_model_W.joblib')),
    'clf_ns':   joblib.load(os.path.join(MODEL_DIR, 'march_madness_model_no_seed_W.joblib')),
    'spread':   joblib.load(os.path.join(MODEL_DIR, 'spread_model_W.joblib')),
    'spread_ns':joblib.load(os.path.join(MODEL_DIR, 'spread_model_no_seed_W.joblib')),
    'total':    joblib.load(os.path.join(MODEL_DIR, 'total_model_W.joblib')),
    'total_ns': joblib.load(os.path.join(MODEL_DIR, 'total_model_no_seed_W.joblib')),
}

kaggle_bundle = joblib.load(os.path.join(MODEL_DIR, 'kaggle_proba.joblib'))
KAGGLE_LOSO   = kaggle_bundle['models']
KAGGLE_SPLINE = kaggle_bundle['spline']
KAGGLE_T      = kaggle_bundle['t']
KAGGLE_SPREAD = joblib.load(os.path.join(MODEL_DIR, 'kaggle_spread.joblib'))
KAGGLE_TOTAL  = joblib.load(os.path.join(MODEL_DIR, 'kaggle_total.joblib'))

KAGGLE_FEATURES = [
    "men_women","T1_seed","T2_seed","Seed_diff",
    "T1_avg_Score","T1_avg_FGA","T1_avg_OR","T1_avg_DR","T1_avg_Blk","T1_avg_PF",
    "T1_avg_opponent_FGA","T1_avg_opponent_Blk","T1_avg_opponent_PF","T1_avg_PointDiff",
    "T2_avg_Score","T2_avg_FGA","T2_avg_OR","T2_avg_DR","T2_avg_Blk","T2_avg_PF",
    "T2_avg_opponent_FGA","T2_avg_opponent_Blk","T2_avg_opponent_PF","T2_avg_PointDiff",
    "T1_elo","T2_elo","elo_diff","T1_quality","T2_quality",
]

# ═══════════════════════════════════════════════════════════════
# PER-ROUND MODELS — load cached or train fresh
# ═══════════════════════════════════════════════════════════════
NON_FEATURE_COLS = {'SEASON','WIN_INDICATOR','L_TEAMID','W_TEAMID','W_SCORE','L_SCORE','ROUND','L_REGION','W_REGION'}
DROP_COLS = ['W_CTWINS','W_AVERAGECTSCORE','L_CTWINS','L_AVERAGECTSCORE',
             'W_WLOCN','W_WLOCH','W_WLOCA','L_WLOCN','L_WLOCH','L_WLOCA']

def train_round_models(csv_path, label):
    print(f"  Training per-round models ({label})...")
    final = (pd.read_csv(csv_path)
             .rename(columns={'WTEAMID':'W_TEAMID','LTEAMID':'L_TEAMID','WSCORE':'W_SCORE','LSCORE':'L_SCORE'}))
    final['WIN_INDICATOR'] = 1
    final = final.drop(columns=[c for c in DROP_COLS if c in final.columns])
    feat_cols = [c for c in final.columns if c not in NON_FEATURE_COLS]

    train = final[(final.SEASON >= 2010) & (final.SEASON <= 2025)].copy()
    w_cols = sorted([c for c in train.columns if c.startswith('W_')])
    l_cols = ['L_' + c[2:] for c in w_cols]
    swapped = train.copy()
    for wc, lc in zip(w_cols, l_cols): swapped[wc] = train[lc]; swapped[lc] = train[wc]
    train = pd.concat([train, swapped], ignore_index=True)
    train['WIN_INDICATOR'] = (train['W_SCORE'] > train['L_SCORE']).astype(int)

    WIN_P = dict(learning_rate=0.1, max_depth=4, min_child_weight=4, n_estimators=100, eval_metric='logloss')
    REG_P = dict(learning_rate=0.1, max_depth=3, min_child_weight=2, n_estimators=100, eval_metric='rmse')

    round_models = {}
    for r in range(0, 7):
        rt = train[train.ROUND == r]
        if len(rt) < 5: continue
        X = rt[feat_cols]
        round_models[r] = {
            'win':    XGBClassifier(**WIN_P).fit(X, rt['WIN_INDICATOR']),
            'spread': XGBRegressor(**REG_P).fit(X, rt['W_SCORE'] - rt['L_SCORE']),
            'total':  XGBRegressor(**REG_P).fit(X, rt['W_SCORE'] + rt['L_SCORE']),
        }
        print(f"    Round {r}: {len(rt)//2} games")
    return round_models, feat_cols

print("\nPer-round models:")
pr_m_path = os.path.join(MODEL_DIR, 'round_models_M.joblib')
pr_w_path = os.path.join(MODEL_DIR, 'round_models_W.joblib')

if os.path.exists(pr_m_path):
    print("  Loading cached M round models...")
    PR_M, PR_M_FEAT = joblib.load(pr_m_path)
else:
    PR_M, PR_M_FEAT = train_round_models(os.path.join(DATA_DIR, 'final_features.csv'), 'Men')
    joblib.dump((PR_M, PR_M_FEAT), pr_m_path)
    print("  Saved round_models_M.joblib")

if os.path.exists(pr_w_path):
    print("  Loading cached W round models...")
    PR_W, PR_W_FEAT = joblib.load(pr_w_path)
else:
    PR_W, PR_W_FEAT = train_round_models(os.path.join(DATA_DIR, 'final_features_W.csv'), 'Women')
    joblib.dump((PR_W, PR_W_FEAT), pr_w_path)
    print("  Saved round_models_W.joblib")

# ═══════════════════════════════════════════════════════════════
# SEASON STATS & NAME MAPS
# ═══════════════════════════════════════════════════════════════
ss_m_2026 = pd.read_csv(os.path.join(DATA_DIR, 'final_season_stats.csv'))
ss_m_2026 = ss_m_2026[ss_m_2026.SEASON == 2026].drop(columns=['SEASON']).set_index('TEAMID')

ss_w_2026 = pd.read_csv(os.path.join(DATA_DIR, 'final_season_stats_W.csv'))
ss_w_2026 = ss_w_2026[ss_w_2026.SEASON == 2026].drop(columns=['SEASON']).set_index('TEAMID')

def build_map(path, manual):
    df = pd.read_csv(path)
    d = dict(zip(df.TeamNameSpelling.str.lower(), df.TeamID))
    d.update(manual)
    return d

men_name_map = build_map(os.path.join(DATA_DIR, 'MTeamSpellings.csv'), {
    "st john's": 1385, 'n iowa': 1320, 's florida': 1378, 'n carolina': 1314,
    'lehigh*': 1250, 'umbc*': 1420, 'smu*': 1374, 'nc state*': 1301,
})
women_name_map = build_map(os.path.join(DATA_DIR, 'WTeamSpellings.csv'), {
    'n carolina': 3314, 's carolina': 3376, 'w virginia': 3452, 'high point': 3219,
    's univ*': 3380, 'sf austin*': 3372, 'virginia*': 3438, 'nebraska*': 3304,
})

# ═══════════════════════════════════════════════════════════════
# KAGGLE FEATURES FOR 2026
# ═══════════════════════════════════════════════════════════════
def prepare_data_kf(df):
    df = df[["Season","DayNum","LTeamID","LScore","WTeamID","WScore","NumOT",
             "LFGM","LFGA","LFGM3","LFGA3","LFTM","LFTA","LOR","LDR","LAst","LTO","LStl","LBlk","LPF",
             "WFGM","WFGA","WFGM3","WFGA3","WFTM","WFTA","WOR","WDR","WAst","WTO","WStl","WBlk","WPF"]].copy()
    adjot = (40 + 5 * df["NumOT"]) / 40
    for col in [c for c in df.columns if c not in ["Season","DayNum","LTeamID","WTeamID","NumOT"]]:
        df[col] = df[col] / adjot
    dfswap = df.copy()
    df.columns    = [x.replace("W","T1_").replace("L","T2_") for x in df.columns]
    dfswap.columns= [x.replace("L","T1_").replace("W","T2_") for x in dfswap.columns]
    out = pd.concat([df, dfswap]).reset_index(drop=True)
    out["PointDiff"] = out["T1_Score"] - out["T2_Score"]
    out["win"] = (out["PointDiff"] > 0).astype(int)
    return out

def compute_kaggle_feats_2026(regular_csv):
    raw = pd.read_csv(regular_csv)
    raw = raw[raw.Season == 2026]
    if len(raw) == 0: return {}
    reg = prepare_data_kf(raw)
    BOXCOLS = [
        "T1_Score","T1_FGM","T1_FGA","T1_FGM3","T1_FGA3","T1_FTM","T1_FTA",
        "T1_OR","T1_DR","T1_Ast","T1_TO","T1_Stl","T1_Blk","T1_PF",
        "T2_Score","T2_FGM","T2_FGA","T2_FGM3","T2_FGA3","T2_FTM","T2_FTA",
        "T2_OR","T2_DR","T2_Ast","T2_TO","T2_Stl","T2_Blk","T2_PF","PointDiff",
    ]
    ss = reg.groupby("T1_TeamID")[BOXCOLS].mean()
    ss.columns = [x.replace("T1_","avg_").replace("T2_","avg_opponent_") for x in ss.columns]
    # ELO
    base_elo, elo_width, k_factor = 1000, 400, 100
    wins = reg[reg.win == 1].reset_index(drop=True)
    teams = set(wins.T1_TeamID) | set(wins.T2_TeamID)
    elo = dict.fromkeys(teams, base_elo)
    for i in range(len(wins)):
        w, l = wins.loc[i,"T1_TeamID"], wins.loc[i,"T2_TeamID"]
        exp = 1.0 / (1 + 10**((elo[l]-elo[w])/elo_width))
        c = k_factor*(1-exp); elo[w]+=c; elo[l]-=c
    # GLM quality
    dt = reg.copy()
    dt["T1_TeamID"] = dt["T1_TeamID"].astype(str)
    dt["T2_TeamID"] = dt["T2_TeamID"].astype(str)
    try:
        glm = sm.GLM.from_formula("PointDiff~-1+T1_TeamID+T2_TeamID",
                                   data=dt, family=sm.families.Gaussian()).fit()
        q = pd.DataFrame(glm.params).reset_index()
        q.columns = ["param","quality"]
        q = q[q.param.str.contains("T1_")].copy()
        q["TeamID"] = q["param"].apply(lambda x: x[10:14]).astype(int)
        quality_s = q.set_index("TeamID")["quality"]
    except:
        quality_s = pd.Series(dtype=float)
    result = {}
    for tid in set(ss.index) | set(elo.keys()):
        feat = dict(ss.loc[tid]) if tid in ss.index else {c: float(ss[c].median()) for c in ss.columns}
        feat['elo']     = elo.get(tid, base_elo)
        feat['quality'] = float(quality_s.get(tid, quality_s.median() if len(quality_s) else 0.0))
        result[tid] = feat
    return result

print("\nComputing kaggle features for 2026 (GLM takes ~30s)...")
KF_M = compute_kaggle_feats_2026(os.path.join(DATA_DIR, 'MRegularSeasonDetailedResults.csv'))
KF_W = compute_kaggle_feats_2026(os.path.join(DATA_DIR, 'WRegularSeasonDetailedResults.csv'))
print(f"  M: {len(KF_M)} teams,  W: {len(KF_W)} teams")

# ═══════════════════════════════════════════════════════════════
# TOURNAMENT TEAM DEFINITIONS
# ═══════════════════════════════════════════════════════════════
# (game_id, top_name, top_seed, bot_name, bot_seed, region)
MEN_GAMES = [
    ('M_PI_X16','Lehigh',16,'Prairie View',16,'X'), ('M_PI_Y11','Miami OH',11,'SMU',11,'Y'),
    ('M_PI_Y16','Howard',16,'UMBC',16,'Y'), ('M_PI_Z11','NC State',11,'Texas',11,'Z'),
    ('M_W_R64_1v16','Duke',1,'Siena',16,'W'), ('M_W_R64_8v9','Ohio St',8,'TCU',9,'W'),
    ("M_W_R64_5v12","St John's",5,'N Iowa',12,'W'), ('M_W_R64_4v13','Kansas',4,'Cal Baptist',13,'W'),
    ('M_W_R64_6v11','Louisville',6,'S Florida',11,'W'), ('M_W_R64_3v14','Michigan St',3,'N Dakota St',14,'W'),
    ('M_W_R64_7v10','UCLA',7,'UCF',10,'W'), ('M_W_R64_2v15','Connecticut',2,'Furman',15,'W'),
    ('M_X_R64_1v16','Florida',1,'Lehigh*',16,'X'), ('M_X_R64_8v9','Clemson',8,'Iowa',9,'X'),
    ('M_X_R64_5v12','Vanderbilt',5,'McNeese St',12,'X'), ('M_X_R64_4v13','Nebraska',4,'Troy',13,'X'),
    ('M_X_R64_6v11','N Carolina',6,'VCU',11,'X'), ('M_X_R64_3v14','Illinois',3,'Penn',14,'X'),
    ("M_X_R64_7v10","St Mary's CA",7,'Texas A&M',10,'X'), ('M_X_R64_2v15','Houston',2,'Idaho',15,'X'),
    ('M_Y_R64_1v16','Michigan',1,'UMBC*',16,'Y'), ('M_Y_R64_8v9','Georgia',8,'St Louis',9,'Y'),
    ('M_Y_R64_5v12','Texas Tech',5,'Akron',12,'Y'), ('M_Y_R64_4v13','Alabama',4,'Hofstra',13,'Y'),
    ('M_Y_R64_6v11','Tennessee',6,'SMU*',11,'Y'), ('M_Y_R64_3v14','Virginia',3,'Wright St',14,'Y'),
    ('M_Y_R64_7v10','Kentucky',7,'Santa Clara',10,'Y'), ('M_Y_R64_2v15','Iowa St',2,'Tennessee St',15,'Y'),
    ('M_Z_R64_1v16','Arizona',1,'LIU Brooklyn',16,'Z'), ('M_Z_R64_8v9','Villanova',8,'Utah St',9,'Z'),
    ('M_Z_R64_5v12','Wisconsin',5,'High Point',12,'Z'), ('M_Z_R64_4v13','Arkansas',4,'Hawaii',13,'Z'),
    ('M_Z_R64_6v11','BYU',6,'NC State*',11,'Z'), ('M_Z_R64_3v14','Gonzaga',3,'Kennesaw',14,'Z'),
    ('M_Z_R64_7v10','Miami FL',7,'Missouri',10,'Z'), ('M_Z_R64_2v15','Purdue',2,'Queens NC',15,'Z'),
]
WOMEN_GAMES = [
    ('W_PI_X10','Arizona St',10,'Virginia',10,'X'), ('W_PI_X16','Samford',16,'Southern Univ',16,'X'),
    ('W_PI_Y16','Missouri St',16,'SF Austin',16,'Y'), ('W_PI_Z11','Nebraska',11,'Richmond',11,'Z'),
    ('W_W_R64_1v16','Connecticut',1,'UT San Antonio',16,'W'), ('W_W_R64_8v9','Iowa St',8,'Syracuse',9,'W'),
    ('W_W_R64_5v12','Maryland',5,'Murray St',12,'W'), ('W_W_R64_4v13','N Carolina',4,'W Illinois',13,'W'),
    ('W_W_R64_6v11','Notre Dame',6,'Fairfield',11,'W'), ('W_W_R64_3v14','Ohio St',3,'Howard',14,'W'),
    ('W_W_R64_7v10','Illinois',7,'Colorado',10,'W'), ('W_W_R64_2v15','Vanderbilt',2,'High Point',15,'W'),
    ('W_X_R64_1v16','S Carolina',1,'S Univ*',16,'X'), ('W_X_R64_8v9','Clemson',8,'USC',9,'X'),
    ('W_X_R64_5v12','Michigan St',5,'Colorado St',12,'X'), ('W_X_R64_4v13','Oklahoma',4,'Idaho',13,'X'),
    ('W_X_R64_6v11','Washington',6,'S Dakota St',11,'X'), ('W_X_R64_3v14','TCU',3,'UC San Diego',14,'X'),
    ('W_X_R64_7v10','Georgia',7,'Virginia*',10,'X'), ('W_X_R64_2v15','Iowa',2,'F Dickinson',15,'X'),
    ('W_Y_R64_1v16','Texas',1,'SF Austin*',16,'Y'), ('W_Y_R64_8v9','Oregon',8,'Virginia Tech',9,'Y'),
    ('W_Y_R64_5v12','Kentucky',5,'James Madison',12,'Y'), ('W_Y_R64_4v13','W Virginia',4,'Miami OH',13,'Y'),
    ('W_Y_R64_6v11','Alabama',6,'Rhode Island',11,'Y'), ('W_Y_R64_3v14','Louisville',3,'Vermont',14,'Y'),
    ('W_Y_R64_7v10','NC State',7,'Tennessee',10,'Y'), ('W_Y_R64_2v15','Michigan',2,'Holy Cross',15,'Y'),
    ('W_Z_R64_1v16','UCLA',1,'Cal Baptist',16,'Z'), ('W_Z_R64_8v9','Oklahoma St',8,'Princeton',9,'Z'),
    ('W_Z_R64_5v12','Mississippi',5,'Gonzaga',12,'Z'), ('W_Z_R64_4v13','Minnesota',4,'WI Green Bay',13,'Z'),
    ('W_Z_R64_6v11','Baylor',6,'Nebraska*',11,'Z'), ('W_Z_R64_3v14','Duke',3,'Col Charleston',14,'Z'),
    ('W_Z_R64_7v10','Texas Tech',7,'Villanova',10,'Z'), ('W_Z_R64_2v15','LSU',2,'Jacksonville',15,'Z'),
]

def extract_teams_and_seeds(games):
    """Return {clean_name: seed} from all games in the definition list."""
    name_seed = {}
    for gid, top, tseed, bot, bseed, region in games:
        name_seed[top.rstrip('*')] = tseed
        name_seed[bot.rstrip('*')] = bseed
    return name_seed  # {name: seed}

M_SEEDS = extract_teams_and_seeds(MEN_GAMES)
W_SEEDS = extract_teams_and_seeds(WOMEN_GAMES)
print(f"\nM teams: {len(M_SEEDS)},  W teams: {len(W_SEEDS)}")
print(f"M pairs: {len(M_SEEDS)*(len(M_SEEDS)-1)//2},  W pairs: {len(W_SEEDS)*(len(W_SEEDS)-1)//2}")

# ═══════════════════════════════════════════════════════════════
# PREDICTION FUNCTIONS
# ═══════════════════════════════════════════════════════════════
def get_stats_row(name, name_map, stats_2026):
    """Build a dict of W_ or L_ stats for a team by name."""
    tid = name_map.get(name.lower())
    stat_cols = list(stats_2026.columns)
    if tid is not None and tid in stats_2026.index:
        row = stats_2026.loc[tid]
    else:
        row = stats_2026.median()
    return {c: row[c] for c in stat_cols}, tid

def make_model_pred(models_bundle, X_df, feat_key, spread_key, total_key, top_name, bot_name, top_seed, bot_seed, add_seeds=True):
    """Run win/spread/total models and return a prediction dict."""
    df = X_df.copy()
    if add_seeds:
        df['W_SEED'] = top_seed
        df['L_SEED'] = bot_seed
    try:
        feat = models_bundle[feat_key].feature_names_in_
        X = df.reindex(columns=feat, fill_value=0)
        proba = models_bundle[feat_key].predict_proba(X)[0]
        wp = float(proba[1])  # P(top_name wins)
        pred_winner = top_name if wp >= 0.5 else bot_name
        display_prob = float(round(wp if wp >= 0.5 else 1-wp, 3))

        sp_feat = models_bundle[spread_key].feature_names_in_
        raw_spread = float(models_bundle[spread_key].predict(df.reindex(columns=sp_feat, fill_value=0))[0])
        # raw_spread is positive if top_name is favored, negative if bot_name is favored
        if pred_winner == bot_name: raw_spread = -raw_spread

        t_feat = models_bundle[total_key].feature_names_in_
        total = round(float(models_bundle[total_key].predict(df.reindex(columns=t_feat, fill_value=0))[0]), 1)

        return {'predWinner': pred_winner, 'winProb': display_prob,
                'spread': round(abs(raw_spread), 1), 'total': total}
    except Exception as e:
        return None

def make_per_round_pred(round_models, feat_cols, X_df, top_seed, bot_seed, top_name, bot_name, game_round):
    df = X_df.copy()
    df['W_SEED'] = top_seed
    df['L_SEED'] = bot_seed
    rm = round_models.get(game_round) or round_models.get(1)
    if not rm: return None
    try:
        X = df.reindex(columns=feat_cols, fill_value=0)
        proba = rm['win'].predict_proba(X)[0]
        wp = float(proba[1])
        pred_winner = top_name if wp >= 0.5 else bot_name
        display_prob = float(round(wp if wp >= 0.5 else 1-wp, 3))
        raw_spread = float(rm['spread'].predict(X)[0])
        if pred_winner == bot_name: raw_spread = -raw_spread
        total = round(float(rm['total'].predict(X)[0]), 1)
        return {'predWinner': pred_winner, 'winProb': display_prob,
                'spread': round(abs(raw_spread), 1), 'total': total}
    except:
        return None

def make_kaggle_pred(kaggle_feats, top_id, bot_id, top_seed, bot_seed, top_name, bot_name, men_women):
    if not kaggle_feats: return None
    median_feats = {k: float(np.median([v[k] for v in kaggle_feats.values() if k in v]))
                    for k in next(iter(kaggle_feats.values()))}
    t1 = kaggle_feats.get(top_id, median_feats)
    t2 = kaggle_feats.get(bot_id, median_feats)
    krow = {'men_women': men_women, 'T1_seed': top_seed, 'T2_seed': bot_seed,
            'Seed_diff': bot_seed - top_seed, 'elo_diff': t1.get('elo',1000) - t2.get('elo',1000)}
    for k, v in t1.items(): krow[f'T1_{k}'] = v
    for k, v in t2.items(): krow[f'T2_{k}'] = v
    try:
        kdf = pd.DataFrame([krow])
        dtest = xgb.DMatrix(kdf.reindex(columns=KAGGLE_FEATURES, fill_value=0).values)
        avg_margin = float(np.array([KAGGLE_LOSO[s].predict(dtest) for s in sorted(KAGGLE_LOSO)]).mean())
        win_prob_k = float(np.clip(KAGGLE_SPLINE(np.clip([avg_margin], -KAGGLE_T, KAGGLE_T)), 0.01, 0.99)[0])
        pred_winner = top_name if win_prob_k >= 0.5 else bot_name
        display_prob = float(round(win_prob_k if win_prob_k >= 0.5 else 1-win_prob_k, 3))

        X_kr = kdf.reindex(columns=KAGGLE_SPREAD.feature_names_in_, fill_value=0)
        raw_spread = float(KAGGLE_SPREAD.predict(X_kr)[0])
        if pred_winner == bot_name: raw_spread = -raw_spread
        total = round(float(KAGGLE_TOTAL.predict(X_kr)[0]), 1)
        return {'predWinner': pred_winner, 'winProb': display_prob,
                'spread': round(abs(raw_spread), 1), 'total': total}
    except Exception as e:
        return None

# ═══════════════════════════════════════════════════════════════
# GENERATE ALL MATCHUPS
# ═══════════════════════════════════════════════════════════════
def generate_gender_matchups(team_seeds, name_map, stats_2026, models_bundle,
                              pr_models, pr_feat_cols, kaggle_feats, men_women, prefix):
    all_teams = sorted(team_seeds.keys())
    output = {}
    total_pairs = len(all_teams) * (len(all_teams) - 1) // 2
    print(f"\n  Generating {total_pairs} {prefix.upper()} matchup predictions...")

    for i, (name_a, name_b) in enumerate(combinations(all_teams, 2)):
        # Always use alphabetically-first as "top" (W_) for consistency
        top, bot = (name_a, name_b) if name_a <= name_b else (name_b, name_a)
        top_seed = team_seeds[top]
        bot_seed = team_seeds[bot]

        top_stats, top_id = get_stats_row(top, name_map, stats_2026)
        bot_stats, bot_id = get_stats_row(bot, name_map, stats_2026)

        row = {f'W_{c}': v for c, v in top_stats.items()}
        row.update({f'L_{c}': v for c, v in bot_stats.items()})
        df = pd.DataFrame([row])

        entry = {}
        # Seeded
        entry['seeded'] = make_model_pred(models_bundle, df, 'clf', 'spread', 'total',
                                           top, bot, top_seed, bot_seed, add_seeds=True)
        # No-Seed
        entry['noSeed'] = make_model_pred(models_bundle, df, 'clf_ns', 'spread_ns', 'total_ns',
                                           top, bot, top_seed, bot_seed, add_seeds=False)
        # Kaggle
        entry['kaggle'] = make_kaggle_pred(kaggle_feats, top_id, bot_id,
                                            top_seed, bot_seed, top, bot, men_women)
        # Per-Round (for each round 0-6)
        entry['perRound'] = {}
        for r in range(0, 7):
            pred = make_per_round_pred(pr_models, pr_feat_cols, df, top_seed, bot_seed, top, bot, r)
            if pred:
                entry['perRound'][str(r)] = pred

        key = f"{prefix}:{top}|{bot}"
        output[key] = entry

        if (i + 1) % 200 == 0:
            print(f"    {i+1}/{total_pairs}")

    return output

output = {}
output.update(generate_gender_matchups(
    M_SEEDS, men_name_map, ss_m_2026, M_MODELS,
    PR_M, PR_M_FEAT, KF_M, men_women=1, prefix='m'))
output.update(generate_gender_matchups(
    W_SEEDS, women_name_map, ss_w_2026, W_MODELS,
    PR_W, PR_W_FEAT, KF_W, men_women=0, prefix='w'))

with open(OUT_FILE, 'w') as f:
    json.dump(output, f, separators=(',', ':'))  # compact JSON to reduce file size

size_kb = os.path.getsize(OUT_FILE) / 1024
print(f"\nSaved {len(output)} entries ({size_kb:.0f} KB) to {OUT_FILE}")
