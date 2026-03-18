"""
Generate modelPredictions.json for ALL bracket rounds (both genders).
Outputs seeded, no-seed, per-round, and kaggle predictions for every game.
"""
import json, os, warnings
import numpy as np
import pandas as pd
import joblib
import statsmodels.api as sm
import xgboost as xgb
from xgboost import XGBClassifier, XGBRegressor

warnings.filterwarnings('ignore')

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'model')
DATA_DIR  = os.path.join(BASE, 'data_2026')
OUT_FILE  = os.path.join(BASE, 'march-madness-tracker', 'src', 'data', 'modelPredictions.json')

# ── Load seeded / no-seed models ────────────────────────────────
print("Loading models...")
M = {
    'clf':      joblib.load(os.path.join(MODEL_DIR, 'march_madness_model.joblib')),
    'clf_ns':   joblib.load(os.path.join(MODEL_DIR, 'march_madness_model_no_seed.joblib')),
    'spread':   joblib.load(os.path.join(MODEL_DIR, 'spread_model.joblib')),
    'spread_ns':joblib.load(os.path.join(MODEL_DIR, 'spread_model_no_seed.joblib')),
    'total':    joblib.load(os.path.join(MODEL_DIR, 'total_model.joblib')),
    'total_ns': joblib.load(os.path.join(MODEL_DIR, 'total_model_no_seed.joblib')),
}
W = {
    'clf':      joblib.load(os.path.join(MODEL_DIR, 'march_madness_model_W.joblib')),
    'clf_ns':   joblib.load(os.path.join(MODEL_DIR, 'march_madness_model_no_seed_W.joblib')),
    'spread':   joblib.load(os.path.join(MODEL_DIR, 'spread_model_W.joblib')),
    'spread_ns':joblib.load(os.path.join(MODEL_DIR, 'spread_model_no_seed_W.joblib')),
    'total':    joblib.load(os.path.join(MODEL_DIR, 'total_model_W.joblib')),
    'total_ns': joblib.load(os.path.join(MODEL_DIR, 'total_model_no_seed_W.joblib')),
}

# ── Load season stats ──────────────────────────────────────────
ss_m = pd.read_csv(os.path.join(DATA_DIR, 'final_season_stats.csv'))
ss_m_2026 = ss_m[ss_m.SEASON == 2026].drop(columns=['SEASON']).set_index('TEAMID')

ss_w = pd.read_csv(os.path.join(DATA_DIR, 'final_season_stats_W.csv'))
ss_w_2026 = ss_w[ss_w.SEASON == 2026].drop(columns=['SEASON']).set_index('TEAMID')

# ── Build name → ID maps ───────────────────────────────────────
def build_map(path, manual):
    df = pd.read_csv(path)
    d = dict(zip(df.TeamNameSpelling.str.lower(), df.TeamID))
    d.update(manual)
    return d

men_name_map = build_map(os.path.join(DATA_DIR, 'MTeamSpellings.csv'), {
    "st john's": 1385,
    'n iowa':    1320,
    's florida': 1378,
    'n carolina':1314,
    'lehigh*':   1250,
    'umbc*':     1420,
    'smu*':      1374,
    'nc state*': 1301,
})

women_name_map = build_map(os.path.join(DATA_DIR, 'WTeamSpellings.csv'), {
    'n carolina':  3314,
    's carolina':  3376,
    'w virginia':  3452,
    'high point':  3219,
    's univ*':     3380,
    'sf austin*':  3372,
    'virginia*':   3438,
    'nebraska*':   3304,
})


# PER-ROUND MODELS -- unbalanced and balanced, all data (2003-2025)

NON_FEATURE_COLS = {"SEASON", "WIN_INDICATOR", "L_TEAMID", "W_TEAMID",
                    "W_SCORE", "L_SCORE", "ROUND", "L_REGION", "W_REGION"}
DROP_COLS = ["W_CTWINS", "W_AVERAGECTSCORE", "L_CTWINS", "L_AVERAGECTSCORE",
             "W_WLOCN", "W_WLOCH", "W_WLOCA", "L_WLOCN", "L_WLOCH", "L_WLOCA"]
UPSET_SEED_DIFF = 5

def _load_and_augment_all(csv_path):
    final = (
        pd.read_csv(csv_path)
        .rename(columns={"WTEAMID":"W_TEAMID","LTEAMID":"L_TEAMID","WSCORE":"W_SCORE","LSCORE":"L_SCORE"})
    )
    final = final.drop(columns=[c for c in DROP_COLS if c in final.columns])
    feat_cols = [c for c in final.columns if c not in NON_FEATURE_COLS]
    train = final[final.SEASON <= 2025].copy()
    w_cols = sorted([c for c in train.columns if c.startswith("W_")])
    l_cols = ["L_" + c[2:] for c in w_cols]
    swapped = train.copy()
    for wc, lc in zip(w_cols, l_cols):
        swapped[wc] = train[lc]; swapped[lc] = train[wc]
    train = pd.concat([train, swapped], ignore_index=True)
    train["WIN_INDICATOR"] = (train["W_SCORE"] > train["L_SCORE"]).astype(int)
    return train, feat_cols

def train_unbalanced_rounds(csv_path, label):
    print(f"Training unbalanced_rounds ({label}, all seasons 2003-2025)...")
    train, feat_cols = _load_and_augment_all(csv_path)
    WIN_P = dict(learning_rate=0.1, max_depth=4, min_child_weight=4, n_estimators=100, eval_metric="logloss")
    REG_P = dict(learning_rate=0.1, max_depth=3, min_child_weight=2, n_estimators=100, eval_metric="rmse")
    round_models = {}
    for r in range(0, 7):
        rt = train[train.ROUND == r]
        if len(rt) < 5: continue
        X = rt[feat_cols]
        round_models[r] = {
            "win":    XGBClassifier(**WIN_P).fit(X, rt["WIN_INDICATOR"]),
            "spread": XGBRegressor(**REG_P).fit(X, rt["W_SCORE"] - rt["L_SCORE"]),
            "total":  XGBRegressor(**REG_P).fit(X, rt["W_SCORE"] + rt["L_SCORE"]),
        }
        print(f"  Round {r}: {len(rt)//2} unique games in training set")
    return round_models, feat_cols

def train_balanced_rounds(csv_path, label):
    print(f"Training balanced_rounds ({label}, scale_pos_weight, all seasons 2003-2025)...")
    train, feat_cols = _load_and_augment_all(csv_path)
    WIN_P = dict(learning_rate=0.1, max_depth=4, min_child_weight=4, n_estimators=100, eval_metric="logloss")
    REG_P = dict(learning_rate=0.1, max_depth=3, min_child_weight=2, n_estimators=100, eval_metric="rmse")
    round_models = {}
    for r in range(0, 7):
        rt = train[train.ROUND == r]
        if len(rt) < 5: continue
        X = rt[feat_cols]
        y_win = rt["WIN_INDICATOR"]
        seed_diff = rt["W_SEED"] - rt["L_SEED"]
        n_upsets = ((seed_diff >= UPSET_SEED_DIFF) & (y_win == 1)).sum()
        n_non = len(rt) - n_upsets
        spw = round(n_non / n_upsets, 2) if n_upsets > 0 else 1.0
        round_models[r] = {
            "win":    XGBClassifier(scale_pos_weight=spw, **WIN_P).fit(X, y_win),
            "spread": XGBRegressor(**REG_P).fit(X, rt["W_SCORE"] - rt["L_SCORE"]),
            "total":  XGBRegressor(**REG_P).fit(X, rt["W_SCORE"] + rt["L_SCORE"]),
        }
        print(f"  Round {r}: {len(rt)//2} games | scale_pos_weight={spw}")
    return round_models, feat_cols


PR_M_UNBAL, PR_M_UNBAL_FEAT = train_unbalanced_rounds(os.path.join(DATA_DIR, "final_features.csv"), "Men")
PR_W_UNBAL, PR_W_UNBAL_FEAT = train_unbalanced_rounds(os.path.join(DATA_DIR, "final_features_W.csv"), "Women")
PR_M_BAL,   PR_M_BAL_FEAT   = train_balanced_rounds(os.path.join(DATA_DIR, "final_features.csv"), "Men")
PR_W_BAL,   PR_W_BAL_FEAT   = train_balanced_rounds(os.path.join(DATA_DIR, "final_features_W.csv"), "Women")

# ══════════════════════════════════════════════════════════════
# KAGGLE FEATURES FOR 2026
# ══════════════════════════════════════════════════════════════

KAGGLE_FEATURES = [
    "men_women", "T1_seed", "T2_seed", "Seed_diff",
    "T1_avg_Score","T1_avg_FGA","T1_avg_OR","T1_avg_DR","T1_avg_Blk","T1_avg_PF",
    "T1_avg_opponent_FGA","T1_avg_opponent_Blk","T1_avg_opponent_PF","T1_avg_PointDiff",
    "T2_avg_Score","T2_avg_FGA","T2_avg_OR","T2_avg_DR","T2_avg_Blk","T2_avg_PF",
    "T2_avg_opponent_FGA","T2_avg_opponent_Blk","T2_avg_opponent_PF","T2_avg_PointDiff",
    "T1_elo","T2_elo","elo_diff","T1_quality","T2_quality",
]

def prepare_data_kf(df):
    """OT-adjust and create T1/T2 oriented rows."""
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

def compute_kaggle_team_feats_2026(regular_csv, men_women_flag):
    """Compute per-team kaggle feature vectors for Season=2026."""
    raw = pd.read_csv(regular_csv)
    raw = raw[raw.Season == 2026]
    if len(raw) == 0:
        print(f"  WARNING: no 2026 data in {regular_csv}")
        return {}

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
        c = k_factor * (1 - exp)
        elo[w] += c; elo[l] -= c
    elo_s = pd.Series(elo, name='elo')

    # GLM quality (2026 only — fast)
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
    except Exception as e:
        print(f"  GLM warning: {e} — using zeros for quality")
        quality_s = pd.Series(dtype=float)

    result = {}
    all_team_ids = set(ss.index) | set(elo.keys())
    for tid in all_team_ids:
        feat = {}
        if tid in ss.index:
            feat.update(ss.loc[tid].to_dict())
        else:
            feat.update({c: ss[c].median() for c in ss.columns})
        feat['elo']     = elo.get(tid, base_elo)
        feat['quality'] = float(quality_s.get(tid, quality_s.median() if len(quality_s) else 0.0))
        result[tid] = feat

    print(f"  Kaggle features computed for {len(result)} teams (men_women={men_women_flag})")
    return result

print("\nComputing kaggle features for 2026...")
KF_M = compute_kaggle_team_feats_2026(
    os.path.join(DATA_DIR, 'MRegularSeasonDetailedResults.csv'), men_women_flag=1)
KF_W = compute_kaggle_team_feats_2026(
    os.path.join(DATA_DIR, 'WRegularSeasonDetailedResults.csv'), men_women_flag=0)

kaggle_bundle = joblib.load(os.path.join(MODEL_DIR, 'kaggle_proba.joblib'))
KAGGLE_MODELS  = kaggle_bundle['models']   # {season: booster}
KAGGLE_SPLINE  = kaggle_bundle['spline']
KAGGLE_T       = kaggle_bundle['t']
KAGGLE_SPREAD  = joblib.load(os.path.join(MODEL_DIR, 'kaggle_spread.joblib'))
KAGGLE_TOTAL   = joblib.load(os.path.join(MODEL_DIR, 'kaggle_total.joblib'))

def get_game_round(game_id):
    """Extract ROUND integer from a game ID string."""
    if '_PI_' in game_id or game_id.endswith('_PI'):
        return 0
    elif '_R64_' in game_id:
        return 1
    elif '_R32_' in game_id:
        return 2
    elif '_S16_' in game_id:
        return 3
    elif game_id.endswith('_E8'):
        return 4
    elif '_FF_' in game_id:
        return 5
    elif game_id.endswith('_CHAMP') or game_id.endswith('CHAMP'):
        return 6
    return 1

# ── Prediction helpers ─────────────────────────────────────────
def predict_game(name_map, stats_2026, models, top_name, top_seed, bot_name, bot_seed,
                 pr_models_unbal=None, pr_feat_unbal=None,
                 pr_models_bal=None, pr_feat_bal=None,
                 game_id=None, kaggle_feats=None, men_women=1):
    """Return dict with seeded, noSeed, unbalanced_rounds, balanced_rounds, kaggle predictions."""
    top_id = name_map.get(top_name.lower())
    bot_id = name_map.get(bot_name.lower())

    if top_id is None: print(f"  WARNING: no ID for '{top_name}'")
    if bot_id is None: print(f"  WARNING: no ID for '{bot_name}'")

    stat_cols = list(stats_2026.columns)

    def get_stats(tid, prefix):
        if tid is not None and tid in stats_2026.index:
            row = stats_2026.loc[tid]
        else:
            row = stats_2026.median()
        return {f'{prefix}{c}': row[c] for c in stat_cols}

    row = {}
    row.update(get_stats(top_id, 'W_'))
    row.update(get_stats(bot_id, 'L_'))
    df = pd.DataFrame([row])

    results = {}

    # ── Seeded ────────────────────────────────────────────────
    df_s = df.copy()
    df_s['W_SEED'] = top_seed
    df_s['L_SEED'] = bot_seed
    try:
        feat_s = models['clf'].feature_names_in_
        X_s = df_s.reindex(columns=feat_s, fill_value=0)
        proba_s = models['clf'].predict_proba(X_s)[0]
        win_prob_s = float(round(proba_s[1], 3))
        pred_winner_s = top_name if win_prob_s >= 0.5 else bot_name
        display_prob_s = float(round(win_prob_s if win_prob_s >= 0.5 else 1 - win_prob_s, 3))
        spread_s = round(float(models['spread'].predict(df_s.reindex(columns=models['spread'].feature_names_in_, fill_value=0))[0]), 1)
        total_s  = round(float(models['total'].predict(df_s.reindex(columns=models['total'].feature_names_in_, fill_value=0))[0]), 1)
        if pred_winner_s == bot_name:
            spread_s = -spread_s
        results['seeded'] = {'predWinner': pred_winner_s, 'winProb': display_prob_s, 'spread': abs(spread_s), 'total': total_s}
    except Exception as e:
        print(f"  Seeded error: {e}")
        results['seeded'] = None

    # ── No-Seed ────────────────────────────────────────────────
    df_ns = df.copy()
    try:
        feat_ns = models['clf_ns'].feature_names_in_
        X_ns = df_ns.reindex(columns=feat_ns, fill_value=0)
        proba_ns = models['clf_ns'].predict_proba(X_ns)[0]
        win_prob_ns = float(round(proba_ns[1], 3))
        pred_winner_ns = top_name if win_prob_ns >= 0.5 else bot_name
        display_prob_ns = float(round(win_prob_ns if win_prob_ns >= 0.5 else 1 - win_prob_ns, 3))
        spread_ns = round(float(models['spread_ns'].predict(df_ns.reindex(columns=models['spread_ns'].feature_names_in_, fill_value=0))[0]), 1)
        total_ns  = round(float(models['total_ns'].predict(df_ns.reindex(columns=models['total_ns'].feature_names_in_, fill_value=0))[0]), 1)
        if pred_winner_ns == bot_name:
            spread_ns = -spread_ns
        results['noSeed'] = {'predWinner': pred_winner_ns, 'winProb': display_prob_ns, 'spread': abs(spread_ns), 'total': total_ns}
    except Exception as e:
        print(f"  NoSeed error: {e}")
        results['noSeed'] = None

    # -- unbalanced_rounds and balanced_rounds --
    def _run_per_round(pr_models, pr_feat_cols, key_name):
        if not pr_models or not pr_feat_cols or not game_id:
            return
        game_round = get_game_round(game_id)
        rm = pr_models.get(game_round) or pr_models.get(1)
        if not rm:
            return
        try:
            X_pr = df_s.reindex(columns=pr_feat_cols, fill_value=0)
            proba_pr = rm['win'].predict_proba(X_pr)[0]
            win_prob_pr = float(round(proba_pr[1], 3))
            pred_winner_pr = top_name if win_prob_pr >= 0.5 else bot_name
            display_prob_pr = float(round(win_prob_pr if win_prob_pr >= 0.5 else 1 - win_prob_pr, 3))
            spread_pr = round(float(rm['spread'].predict(X_pr)[0]), 1)
            total_pr  = round(float(rm['total'].predict(X_pr)[0]), 1)
            if pred_winner_pr == bot_name:
                spread_pr = -spread_pr
            results[key_name] = {'predWinner': pred_winner_pr, 'winProb': display_prob_pr,
                                  'spread': abs(spread_pr), 'total': total_pr, 'round': game_round}
        except Exception as e:
            print(f'  {key_name} error (round={game_round}): {e}')
            results[key_name] = None

    _run_per_round(pr_models_unbal, pr_feat_unbal, 'unbalanced_rounds')
    _run_per_round(pr_models_bal,   pr_feat_bal,   'balanced_rounds')


    # ── Kaggle ────────────────────────────────────────────────
    if kaggle_feats and top_id and bot_id:
        try:
            median_feats = {k: np.median([v[k] for v in kaggle_feats.values() if k in v])
                            for k in next(iter(kaggle_feats.values()))}
            t1 = kaggle_feats.get(top_id, median_feats)
            t2 = kaggle_feats.get(bot_id, median_feats)

            krow = {'men_women': men_women, 'T1_seed': top_seed, 'T2_seed': bot_seed,
                    'Seed_diff': bot_seed - top_seed}
            for k, v in t1.items():
                col = f'T1_{k}' if not k.startswith('avg_') else f'T1_{k}'
                krow[col] = v
            for k, v in t2.items():
                col = f'T2_{k}' if not k.startswith('avg_') else f'T2_{k}'
                krow[col] = v
            krow['elo_diff'] = t1.get('elo', 1000) - t2.get('elo', 1000)

            kdf = pd.DataFrame([krow])

            # Win probability: average LOSO models, then spline calibration
            dtest = xgb.DMatrix(kdf.reindex(columns=KAGGLE_FEATURES, fill_value=0).values)
            all_margins = np.array([KAGGLE_MODELS[s].predict(dtest) for s in sorted(KAGGLE_MODELS.keys())])
            avg_margin = float(all_margins.mean())
            win_prob_k = float(np.clip(KAGGLE_SPLINE(np.clip([avg_margin], -KAGGLE_T, KAGGLE_T)), 0.01, 0.99)[0])
            pred_winner_k = top_name if win_prob_k >= 0.5 else bot_name
            display_prob_k = float(round(win_prob_k if win_prob_k >= 0.5 else 1 - win_prob_k, 3))

            X_kr = kdf.reindex(columns=KAGGLE_SPREAD.feature_names_in_, fill_value=0)
            spread_k = round(float(KAGGLE_SPREAD.predict(X_kr)[0]), 1)
            total_k  = round(float(KAGGLE_TOTAL.predict(X_kr)[0]), 1)
            if pred_winner_k == bot_name:
                spread_k = -spread_k

            results['kaggle'] = {'predWinner': pred_winner_k, 'winProb': display_prob_k,
                                 'spread': abs(spread_k), 'total': total_k}
        except Exception as e:
            print(f"  Kaggle error: {e}")
            results['kaggle'] = None

    return results

# ── Game definitions ───────────────────────────────────────────
# (game_id, top_name, top_seed, bot_name, bot_seed, region)
MEN_GAMES = [
    # Play-in
    ('M_PI_X16', 'Lehigh', 16, 'Prairie View', 16, 'X'),
    ('M_PI_Y11', 'Miami OH', 11, 'SMU', 11, 'Y'),
    ('M_PI_Y16', 'Howard', 16, 'UMBC', 16, 'Y'),
    ('M_PI_Z11', 'NC State', 11, 'Texas', 11, 'Z'),
    # R64 W
    ('M_W_R64_1v16', 'Duke', 1, 'Siena', 16, 'W'),
    ('M_W_R64_8v9',  'Ohio St', 8, 'TCU', 9, 'W'),
    ('M_W_R64_5v12', "St John's", 5, 'N Iowa', 12, 'W'),
    ('M_W_R64_4v13', 'Kansas', 4, 'Cal Baptist', 13, 'W'),
    ('M_W_R64_6v11', 'Louisville', 6, 'S Florida', 11, 'W'),
    ('M_W_R64_3v14', 'Michigan St', 3, 'N Dakota St', 14, 'W'),
    ('M_W_R64_7v10', 'UCLA', 7, 'UCF', 10, 'W'),
    ('M_W_R64_2v15', 'Connecticut', 2, 'Furman', 15, 'W'),
    # R64 X
    ('M_X_R64_1v16', 'Florida', 1, 'Lehigh*', 16, 'X'),
    ('M_X_R64_8v9',  'Clemson', 8, 'Iowa', 9, 'X'),
    ('M_X_R64_5v12', 'Vanderbilt', 5, 'McNeese St', 12, 'X'),
    ('M_X_R64_4v13', 'Nebraska', 4, 'Troy', 13, 'X'),
    ('M_X_R64_6v11', 'N Carolina', 6, 'VCU', 11, 'X'),
    ('M_X_R64_3v14', 'Illinois', 3, 'Penn', 14, 'X'),
    ('M_X_R64_7v10', "St Mary's CA", 7, 'Texas A&M', 10, 'X'),
    ('M_X_R64_2v15', 'Houston', 2, 'Idaho', 15, 'X'),
    # R64 Y
    ('M_Y_R64_1v16', 'Michigan', 1, 'UMBC*', 16, 'Y'),
    ('M_Y_R64_8v9',  'Georgia', 8, 'St Louis', 9, 'Y'),
    ('M_Y_R64_5v12', 'Texas Tech', 5, 'Akron', 12, 'Y'),
    ('M_Y_R64_4v13', 'Alabama', 4, 'Hofstra', 13, 'Y'),
    ('M_Y_R64_6v11', 'Tennessee', 6, 'SMU*', 11, 'Y'),
    ('M_Y_R64_3v14', 'Virginia', 3, 'Wright St', 14, 'Y'),
    ('M_Y_R64_7v10', 'Kentucky', 7, 'Santa Clara', 10, 'Y'),
    ('M_Y_R64_2v15', 'Iowa St', 2, 'Tennessee St', 15, 'Y'),
    # R64 Z
    ('M_Z_R64_1v16', 'Arizona', 1, 'LIU Brooklyn', 16, 'Z'),
    ('M_Z_R64_8v9',  'Villanova', 8, 'Utah St', 9, 'Z'),
    ('M_Z_R64_5v12', 'Wisconsin', 5, 'High Point', 12, 'Z'),
    ('M_Z_R64_4v13', 'Arkansas', 4, 'Hawaii', 13, 'Z'),
    ('M_Z_R64_6v11', 'BYU', 6, 'NC State*', 11, 'Z'),
    ('M_Z_R64_3v14', 'Gonzaga', 3, 'Kennesaw', 14, 'Z'),
    ('M_Z_R64_7v10', 'Miami FL', 7, 'Missouri', 10, 'Z'),
    ('M_Z_R64_2v15', 'Purdue', 2, 'Queens NC', 15, 'Z'),
    # R32
    ('M_W_R32_1v9',  'Duke', 1, 'TCU', 9, 'W'),
    ('M_W_R32_4v5',  'Kansas', 4, "St John's", 5, 'W'),
    ('M_W_R32_3v6',  'Michigan St', 3, 'Louisville', 6, 'W'),
    ('M_W_R32_2v7',  'Connecticut', 2, 'UCLA', 7, 'W'),
    ('M_X_R32_1v8',  'Florida', 1, 'Clemson', 8, 'X'),
    ('M_X_R32_4v5',  'Nebraska', 4, 'Vanderbilt', 5, 'X'),
    ('M_X_R32_3v6',  'Illinois', 3, 'N Carolina', 6, 'X'),
    ('M_X_R32_2v7',  'Houston', 2, "St Mary's CA", 7, 'X'),
    ('M_Y_R32_1v8',  'Michigan', 1, 'Georgia', 8, 'Y'),
    ('M_Y_R32_4v5',  'Alabama', 4, 'Texas Tech', 5, 'Y'),
    ('M_Y_R32_3v6',  'Virginia', 3, 'Tennessee', 6, 'Y'),
    ('M_Y_R32_2v7',  'Iowa St', 2, 'Kentucky', 7, 'Y'),
    ('M_Z_R32_1v8',  'Arizona', 1, 'Villanova', 8, 'Z'),
    ('M_Z_R32_4v5',  'Arkansas', 4, 'Wisconsin', 5, 'Z'),
    ('M_Z_R32_3v6',  'Gonzaga', 3, 'BYU', 6, 'Z'),
    ('M_Z_R32_2v7',  'Purdue', 2, 'Miami FL', 7, 'Z'),
    # S16
    ('M_W_S16_1v4',  'Duke', 1, 'Kansas', 4, 'W'),
    ('M_W_S16_3v2',  'Michigan St', 3, 'Connecticut', 2, 'W'),
    ('M_X_S16_1v4',  'Florida', 1, 'Nebraska', 4, 'X'),
    ('M_X_S16_3v2',  'Illinois', 3, 'Houston', 2, 'X'),
    ('M_Y_S16_1v5',  'Michigan', 1, 'Texas Tech', 5, 'Y'),
    ('M_Y_S16_3v2',  'Virginia', 3, 'Iowa St', 2, 'Y'),
    ('M_Z_S16_1v4',  'Arizona', 1, 'Arkansas', 4, 'Z'),
    ('M_Z_S16_3v2',  'Gonzaga', 3, 'Purdue', 2, 'Z'),
    # E8
    ('M_W_E8',  'Duke', 1, 'Michigan St', 3, 'W'),
    ('M_X_E8',  'Florida', 1, 'Illinois', 3, 'X'),
    ('M_Y_E8',  'Michigan', 1, 'Virginia', 3, 'Y'),
    ('M_Z_E8',  'Arizona', 1, 'Purdue', 2, 'Z'),
    # Final Four
    ('M_FF_WX', 'Duke', 1, 'Florida', 1, None),
    ('M_FF_YZ', 'Virginia', 3, 'Arizona', 1, None),
    # Championship
    ('M_CHAMP', 'Duke', 1, 'Virginia', 3, None),
]

WOMEN_GAMES = [
    # Play-in
    ('W_PI_X10', 'Arizona St', 10, 'Virginia', 10, 'X'),
    ('W_PI_X16', 'Samford', 16, 'Southern Univ', 16, 'X'),
    ('W_PI_Y16', 'Missouri St', 16, 'SF Austin', 16, 'Y'),
    ('W_PI_Z11', 'Nebraska', 11, 'Richmond', 11, 'Z'),
    # R64 W
    ('W_W_R64_1v16', 'Connecticut', 1, 'UT San Antonio', 16, 'W'),
    ('W_W_R64_8v9',  'Iowa St', 8, 'Syracuse', 9, 'W'),
    ('W_W_R64_5v12', 'Maryland', 5, 'Murray St', 12, 'W'),
    ('W_W_R64_4v13', 'N Carolina', 4, 'W Illinois', 13, 'W'),
    ('W_W_R64_6v11', 'Notre Dame', 6, 'Fairfield', 11, 'W'),
    ('W_W_R64_3v14', 'Ohio St', 3, 'Howard', 14, 'W'),
    ('W_W_R64_7v10', 'Illinois', 7, 'Colorado', 10, 'W'),
    ('W_W_R64_2v15', 'Vanderbilt', 2, 'High Point', 15, 'W'),
    # R64 X
    ('W_X_R64_1v16', 'S Carolina', 1, 'S Univ*', 16, 'X'),
    ('W_X_R64_8v9',  'Clemson', 8, 'USC', 9, 'X'),
    ('W_X_R64_5v12', 'Michigan St', 5, 'Colorado St', 12, 'X'),
    ('W_X_R64_4v13', 'Oklahoma', 4, 'Idaho', 13, 'X'),
    ('W_X_R64_6v11', 'Washington', 6, 'S Dakota St', 11, 'X'),
    ('W_X_R64_3v14', 'TCU', 3, 'UC San Diego', 14, 'X'),
    ('W_X_R64_7v10', 'Georgia', 7, 'Virginia*', 10, 'X'),
    ('W_X_R64_2v15', 'Iowa', 2, 'F Dickinson', 15, 'X'),
    # R64 Y
    ('W_Y_R64_1v16', 'Texas', 1, 'SF Austin*', 16, 'Y'),
    ('W_Y_R64_8v9',  'Oregon', 8, 'Virginia Tech', 9, 'Y'),
    ('W_Y_R64_5v12', 'Kentucky', 5, 'James Madison', 12, 'Y'),
    ('W_Y_R64_4v13', 'W Virginia', 4, 'Miami OH', 13, 'Y'),
    ('W_Y_R64_6v11', 'Alabama', 6, 'Rhode Island', 11, 'Y'),
    ('W_Y_R64_3v14', 'Louisville', 3, 'Vermont', 14, 'Y'),
    ('W_Y_R64_7v10', 'NC State', 7, 'Tennessee', 10, 'Y'),
    ('W_Y_R64_2v15', 'Michigan', 2, 'Holy Cross', 15, 'Y'),
    # R64 Z
    ('W_Z_R64_1v16', 'UCLA', 1, 'Cal Baptist', 16, 'Z'),
    ('W_Z_R64_8v9',  'Oklahoma St', 8, 'Princeton', 9, 'Z'),
    ('W_Z_R64_5v12', 'Mississippi', 5, 'Gonzaga', 12, 'Z'),
    ('W_Z_R64_4v13', 'Minnesota', 4, 'WI Green Bay', 13, 'Z'),
    ('W_Z_R64_6v11', 'Baylor', 6, 'Nebraska*', 11, 'Z'),
    ('W_Z_R64_3v14', 'Duke', 3, 'Col Charleston', 14, 'Z'),
    ('W_Z_R64_7v10', 'Texas Tech', 7, 'Villanova', 10, 'Z'),
    ('W_Z_R64_2v15', 'LSU', 2, 'Jacksonville', 15, 'Z'),
    # R32
    ('W_W_R32_1v9',  'Connecticut', 1, 'Syracuse', 9, 'W'),
    ('W_W_R32_4v5',  'N Carolina', 4, 'Maryland', 5, 'W'),
    ('W_W_R32_3v11', 'Ohio St', 3, 'Fairfield', 11, 'W'),
    ('W_W_R32_2v7',  'Vanderbilt', 2, 'Illinois', 7, 'W'),
    ('W_X_R32_1v9',  'S Carolina', 1, 'USC', 9, 'X'),
    ('W_X_R32_4v5',  'Oklahoma', 4, 'Michigan St', 5, 'X'),
    ('W_X_R32_3v6',  'TCU', 3, 'Washington', 6, 'X'),
    ('W_X_R32_2v7',  'Iowa', 2, 'Georgia', 7, 'X'),
    ('W_Y_R32_1v8',  'Texas', 1, 'Oregon', 8, 'Y'),
    ('W_Y_R32_4v5',  'W Virginia', 4, 'Kentucky', 5, 'Y'),
    ('W_Y_R32_3v6',  'Louisville', 3, 'Alabama', 6, 'Y'),
    ('W_Y_R32_2v10', 'Michigan', 2, 'Tennessee', 10, 'Y'),
    ('W_Z_R32_1v8',  'UCLA', 1, 'Oklahoma St', 8, 'Z'),
    ('W_Z_R32_4v5',  'Minnesota', 4, 'Mississippi', 5, 'Z'),
    ('W_Z_R32_3v6',  'Duke', 3, 'Baylor', 6, 'Z'),
    ('W_Z_R32_2v7',  'LSU', 2, 'Texas Tech', 7, 'Z'),
    # S16
    ('W_W_S16_1v4',  'Connecticut', 1, 'N Carolina', 4, 'W'),
    ('W_W_S16_2v11', 'Fairfield', 11, 'Vanderbilt', 2, 'W'),
    ('W_X_S16_1v5',  'S Carolina', 1, 'Michigan St', 5, 'X'),
    ('W_X_S16_6v7',  'Washington', 6, 'Georgia', 7, 'X'),
    ('W_Y_S16_1v4',  'Texas', 1, 'W Virginia', 4, 'Y'),
    ('W_Y_S16_3v2',  'Louisville', 3, 'Michigan', 2, 'Y'),
    ('W_Z_S16_1v5',  'UCLA', 1, 'Mississippi', 5, 'Z'),
    ('W_Z_S16_3v2',  'Duke', 3, 'LSU', 2, 'Z'),
    # E8
    ('W_W_E8',  'Connecticut', 1, 'Vanderbilt', 2, 'W'),
    ('W_X_E8',  'S Carolina', 1, 'Washington', 6, 'X'),
    ('W_Y_E8',  'Texas', 1, 'Michigan', 2, 'Y'),
    ('W_Z_E8',  'UCLA', 1, 'LSU', 2, 'Z'),
    # Final Four
    ('W_FF_WX', 'Connecticut', 1, 'S Carolina', 1, None),
    ('W_FF_YZ', 'Texas', 1, 'UCLA', 1, None),
    # Championship
    ('W_CHAMP', 'Connecticut', 1, 'Texas', 1, None),
]

# ── Run predictions ────────────────────────────────────────────
output = {}

print("\n=== MEN'S BRACKET ===")
for (gid, top, tseed, bot, bseed, region) in MEN_GAMES:
    print(f"{gid}: {top}({tseed}) vs {bot}({bseed})")
    preds = predict_game(
        men_name_map, ss_m_2026, M, top, tseed, bot, bseed,
        pr_models_unbal=PR_M_UNBAL, pr_feat_unbal=PR_M_UNBAL_FEAT,
        pr_models_bal=PR_M_BAL, pr_feat_bal=PR_M_BAL_FEAT,
        game_id=gid, kaggle_feats=KF_M, men_women=1,
    )
    entry = {'wTeam': top, 'lTeam': bot, 'wSeed': tseed, 'lSeed': bseed, 'region': region}
    entry.update(preds)
    output[gid] = entry

print("\n=== WOMEN'S BRACKET ===")
for (gid, top, tseed, bot, bseed, region) in WOMEN_GAMES:
    print(f"{gid}: {top}({tseed}) vs {bot}({bseed})")
    preds = predict_game(
        women_name_map, ss_w_2026, W, top, tseed, bot, bseed,
        pr_models_unbal=PR_W_UNBAL, pr_feat_unbal=PR_W_UNBAL_FEAT,
        pr_models_bal=PR_W_BAL, pr_feat_bal=PR_W_BAL_FEAT,
        game_id=gid, kaggle_feats=KF_W, men_women=0,
    )
    entry = {'wTeam': top, 'lTeam': bot, 'wSeed': tseed, 'lSeed': bseed, 'region': region}
    entry.update(preds)
    output[gid] = entry

with open(OUT_FILE, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nSaved {len(output)} entries to {OUT_FILE}")
