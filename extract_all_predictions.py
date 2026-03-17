"""
Generate modelPredictions.json for ALL bracket rounds (both genders).
Outputs seeded and no-seed predictions for every game.
"""
import json, os, warnings
import numpy as np
import pandas as pd
import joblib

warnings.filterwarnings('ignore')

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, 'model')
DATA_DIR  = os.path.join(BASE, 'data_2026')
OUT_FILE  = os.path.join(BASE, 'march-madness-tracker', 'src', 'data', 'modelPredictions.json')

# ── Load models ────────────────────────────────────────────────
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

# ── Prediction helper ──────────────────────────────────────────
def predict_game(name_map, stats_2026, models, top_name, top_seed, bot_name, bot_seed):
    """Return (seeded_dict, noseed_dict) or None if stats missing for both teams."""
    top_id = name_map.get(top_name.lower())
    bot_id = name_map.get(bot_name.lower())

    if top_id is None:
        print(f"  WARNING: no ID for '{top_name}'")
    if bot_id is None:
        print(f"  WARNING: no ID for '{bot_name}'")

    stat_cols = list(stats_2026.columns)  # season stat columns (no TEAMID/SEASON)

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

    # Seeded prediction (includes W_SEED, L_SEED)
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

        feat_sp = models['spread'].feature_names_in_
        X_sp = df_s.reindex(columns=feat_sp, fill_value=0)
        spread_s = round(float(models['spread'].predict(X_sp)[0]), 1)

        feat_t = models['total'].feature_names_in_
        X_t = df_s.reindex(columns=feat_t, fill_value=0)
        total_s = round(float(models['total'].predict(X_t)[0]), 1)

        results['seeded'] = {
            'predWinner': pred_winner_s,
            'winProb': display_prob_s,
            'spread': spread_s,
            'total': total_s,
        }
    except Exception as e:
        print(f"  Seeded model error: {e}")
        results['seeded'] = None

    # No-seed prediction
    df_ns = df.copy()
    try:
        feat_ns = models['clf_ns'].feature_names_in_
        X_ns = df_ns.reindex(columns=feat_ns, fill_value=0)
        proba_ns = models['clf_ns'].predict_proba(X_ns)[0]
        win_prob_ns = float(round(proba_ns[1], 3))
        pred_winner_ns = top_name if win_prob_ns >= 0.5 else bot_name
        display_prob_ns = float(round(win_prob_ns if win_prob_ns >= 0.5 else 1 - win_prob_ns, 3))

        feat_sp_ns = models['spread_ns'].feature_names_in_
        X_sp_ns = df_ns.reindex(columns=feat_sp_ns, fill_value=0)
        spread_ns = round(float(models['spread_ns'].predict(X_sp_ns)[0]), 1)

        feat_t_ns = models['total_ns'].feature_names_in_
        X_t_ns = df_ns.reindex(columns=feat_t_ns, fill_value=0)
        total_ns = round(float(models['total_ns'].predict(X_t_ns)[0]), 1)

        results['noSeed'] = {
            'predWinner': pred_winner_ns,
            'winProb': display_prob_ns,
            'spread': spread_ns,
            'total': total_ns,
        }
    except Exception as e:
        print(f"  No-seed model error: {e}")
        results['noSeed'] = None

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
    preds = predict_game(men_name_map, ss_m_2026, M, top, tseed, bot, bseed)
    entry = {
        'wTeam': top, 'lTeam': bot,
        'wSeed': tseed, 'lSeed': bseed,
        'region': region,
        'seeded': preds.get('seeded'),
        'noSeed': preds.get('noSeed'),
    }
    if entry['seeded']:
        print(f"  Seeded: {entry['seeded']}")
    if entry['noSeed']:
        print(f"  NoSeed: {entry['noSeed']}")
    output[gid] = entry

print("\n=== WOMEN'S BRACKET ===")
for (gid, top, tseed, bot, bseed, region) in WOMEN_GAMES:
    print(f"{gid}: {top}({tseed}) vs {bot}({bseed})")
    preds = predict_game(women_name_map, ss_w_2026, W, top, tseed, bot, bseed)
    entry = {
        'wTeam': top, 'lTeam': bot,
        'wSeed': tseed, 'lSeed': bseed,
        'region': region,
        'seeded': preds.get('seeded'),
        'noSeed': preds.get('noSeed'),
    }
    if entry['seeded']:
        print(f"  Seeded: {entry['seeded']}")
    if entry['noSeed']:
        print(f"  NoSeed: {entry['noSeed']}")
    output[gid] = entry

with open(OUT_FILE, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nSaved {len(output)} entries to {OUT_FILE}")
