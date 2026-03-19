"""
eval_kaggle_holdout.py

Fair holdout evaluation of the Kaggle spread and total predictions.
  - Train: 2010–2023
  - Test:  2024–2025
  - Mirrors the exact feature engineering used in generate_kaggle_bracket.py
  - Does NOT save or overwrite any models

Run:  uv run python scripts/eval_kaggle_holdout.py
"""
import os, warnings
import numpy as np
import pandas as pd
import statsmodels.api as sm
from xgboost import XGBRegressor
warnings.filterwarnings('ignore')

BASE     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, 'data_2026')

TRAIN_SEASONS = list(range(2010, 2024))
TEST_SEASONS  = [2024, 2025]

# Exact feature list used by the Kaggle model
KFEATS = [
    "men_women", "T1_seed", "T2_seed", "Seed_diff",
    "T1_avg_Score", "T1_avg_FGA", "T1_avg_OR", "T1_avg_DR", "T1_avg_Blk", "T1_avg_PF",
    "T1_avg_opponent_FGA", "T1_avg_opponent_Blk", "T1_avg_opponent_PF", "T1_avg_PointDiff",
    "T2_avg_Score", "T2_avg_FGA", "T2_avg_OR", "T2_avg_DR", "T2_avg_Blk", "T2_avg_PF",
    "T2_avg_opponent_FGA", "T2_avg_opponent_Blk", "T2_avg_opponent_PF", "T2_avg_PointDiff",
    "T1_elo", "T2_elo", "elo_diff", "T1_quality", "T2_quality",
]

REG_P = dict(n_estimators=400, max_depth=4, learning_rate=0.05,
             subsample=0.8, colsample_bytree=0.8, random_state=42)

DETAIL_COLS = [
    "Season", "DayNum", "LTeamID", "LScore", "WTeamID", "WScore", "NumOT",
    "LFGM", "LFGA", "LFGM3", "LFGA3", "LFTM", "LFTA", "LOR", "LDR", "LAst", "LTO", "LStl", "LBlk", "LPF",
    "WFGM", "WFGA", "WFGM3", "WFGA3", "WFTM", "WFTA", "WOR", "WDR", "WAst", "WTO", "WStl", "WBlk", "WPF",
]
STAT_COLS = [
    "T1_Score","T1_FGM","T1_FGA","T1_FGM3","T1_FGA3","T1_FTM","T1_FTA",
    "T1_OR","T1_DR","T1_Ast","T1_TO","T1_Stl","T1_Blk","T1_PF",
    "T2_Score","T2_FGM","T2_FGA","T2_FGM3","T2_FGA3","T2_FTM","T2_FTA",
    "T2_OR","T2_DR","T2_Ast","T2_TO","T2_Stl","T2_Blk","T2_PF", "PointDiff",
]


def season_team_features(reg_df, season):
    """Compute per-team features (stats, ELO, GLM quality) for one season."""
    df = reg_df[reg_df.Season == season][DETAIL_COLS].copy()
    if not len(df):
        return None

    # Pace-adjust
    adj = (40 + 5 * df["NumOT"]) / 40
    for c in [x for x in DETAIL_COLS if x not in ("Season", "DayNum", "LTeamID", "WTeamID", "NumOT")]:
        df[c] = df[c] / adj

    # Double — both perspectives
    df_w = df.copy()
    df_w.columns = [c.replace("W", "T1_").replace("L", "T2_") for c in df_w.columns]
    df_l = df.copy()
    df_l.columns = [c.replace("L", "T1_").replace("W", "T2_") for c in df_l.columns]
    both = pd.concat([df_w, df_l], ignore_index=True)
    both["PointDiff"] = both["T1_Score"] - both["T2_Score"]
    both["win"] = (both["PointDiff"] > 0).astype(int)

    # Average regular-season stats per team
    ss = both.groupby("T1_TeamID")[STAT_COLS].mean()
    ss.columns = [c.replace("T1_", "avg_").replace("T2_", "avg_opponent_") for c in ss.columns]

    # ELO (season-fresh, resets to 1000 each year — same as generate_kaggle_bracket)
    base, width, k = 1000, 400, 100
    wins = both[both.win == 1].reset_index(drop=True)
    elo = dict.fromkeys(set(wins.T1_TeamID) | set(wins.T2_TeamID), base)
    for i in range(len(wins)):
        w2, l = wins.loc[i, "T1_TeamID"], wins.loc[i, "T2_TeamID"]
        e = 1 / (1 + 10 ** ((elo[l] - elo[w2]) / width))
        c_val = k * (1 - e)
        elo[w2] += c_val
        elo[l]  -= c_val

    # GLM quality
    dt = both.copy()
    dt["T1_TeamID"] = dt["T1_TeamID"].astype(str)
    dt["T2_TeamID"] = dt["T2_TeamID"].astype(str)
    try:
        glm = sm.GLM.from_formula(
            "PointDiff ~ -1 + T1_TeamID + T2_TeamID",
            data=dt, family=sm.families.Gaussian()
        ).fit(disp=False)
        q = pd.DataFrame(glm.params).reset_index()
        q.columns = ["p", "quality"]
        q = q[q.p.str.contains("T1_")].copy()
        q["TeamID"] = q["p"].str.extract(r"T1_TeamID(\d+)")[0].astype(float).astype("Int64")
        qs = q.dropna(subset=["TeamID"]).set_index("TeamID")["quality"]
    except Exception:
        qs = pd.Series(dtype=float)

    # Assemble per-team dict
    med_elo = float(np.median(list(elo.values()))) if elo else base
    med_q   = float(qs.median()) if len(qs) else 0.0
    feats = {}
    for tid in set(ss.index) | set(elo.keys()):
        f = dict(ss.loc[tid]) if tid in ss.index else {c: float(ss[c].median()) for c in ss.columns}
        f["elo"]     = elo.get(tid, med_elo)
        f["quality"] = float(qs.get(tid, med_q))
        feats[tid] = f

    return feats


def build_dataset(reg_path, tourn_path, seeds_path, seasons, mw):
    """Build a DataFrame of KFEATS + targets for all requested seasons."""
    reg_df   = pd.read_csv(reg_path)
    tourn_df = pd.read_csv(tourn_path)
    seeds_df = pd.read_csv(seeds_path)
    seeds_df["seed_num"] = seeds_df["Seed"].str.extract(r"(\d+)").astype(int)

    rows = []
    for season in seasons:
        tf = season_team_features(reg_df, season)
        if tf is None:
            print(f"    {season}: no regular-season detail data, skipping")
            continue

        seed_map = seeds_df[seeds_df.Season == season].set_index("TeamID")["seed_num"]
        tourn    = tourn_df[tourn_df.Season == season]
        med      = {k: float(np.median([v[k] for v in tf.values()])) for k in next(iter(tf.values()))}

        for _, g in tourn.iterrows():
            w_id, l_id = int(g.WTeamID), int(g.LTeamID)
            w_seed = int(seed_map.get(w_id, 8))
            l_seed = int(seed_map.get(l_id, 8))
            t1f    = tf.get(w_id, med)
            t2f    = tf.get(l_id, med)

            row = {
                "season":         season,
                "men_women":      mw,
                "T1_seed":        w_seed,
                "T2_seed":        l_seed,
                "Seed_diff":      l_seed - w_seed,
                "elo_diff":       t1f.get("elo", 1000) - t2f.get("elo", 1000),
                "actual_spread":  float(g.WScore - g.LScore),
                "actual_total":   float(g.WScore + g.LScore),
            }
            for k, v in t1f.items(): row[f"T1_{k}"] = v
            for k, v in t2f.items(): row[f"T2_{k}"] = v
            rows.append(row)

        print(f"    {season}: {len(tourn)} games")

    return pd.DataFrame(rows)


# ── Build datasets ──────────────────────────────────────────────────────────
all_seasons = TRAIN_SEASONS + TEST_SEASONS

print("=== Men's ===")
m_df = build_dataset(
    os.path.join(DATA_DIR, "MRegularSeasonDetailedResults.csv"),
    os.path.join(DATA_DIR, "MNCAATourneyCompactResults.csv"),
    os.path.join(DATA_DIR, "MNCAATourneySeeds.csv"),
    all_seasons, mw=1,
)

print("\n=== Women's ===")
w_df = build_dataset(
    os.path.join(DATA_DIR, "WRegularSeasonDetailedResults.csv"),
    os.path.join(DATA_DIR, "WNCAATourneyCompactResults.csv"),
    os.path.join(DATA_DIR, "WNCAATourneySeeds.csv"),
    all_seasons, mw=0,
)

df = pd.concat([m_df, w_df], ignore_index=True)
df = df.reindex(columns=["season", "actual_spread", "actual_total"] + KFEATS, fill_value=0)

train = df[df.season.isin(TRAIN_SEASONS)]
test  = df[df.season.isin(TEST_SEASONS)]

X_train = train[KFEATS].values
X_test  = test[KFEATS].values
y_spread_train = train["actual_spread"].abs().values   # model predicts abs margin
y_spread_test  = test["actual_spread"].abs().values
y_total_train  = train["actual_total"].values
y_total_test   = test["actual_total"].values

print(f"\nTrain games: {len(train)}  |  Test games: {len(test)}")
print(f"  (train seasons {TRAIN_SEASONS[0]}-{TRAIN_SEASONS[-1]}, "
      f"test seasons {TEST_SEASONS})\n")

# ── Train holdout regressors ────────────────────────────────────────────────
print("Training spread regressor on 2010-2023...")
sp_mdl = XGBRegressor(**REG_P)
sp_mdl.fit(X_train, y_spread_train)

print("Training total regressor on 2010-2023...")
tot_mdl = XGBRegressor(**REG_P)
tot_mdl.fit(X_train, y_total_train)

# ── Evaluate ────────────────────────────────────────────────────────────────
sp_pred  = sp_mdl.predict(X_test)
tot_pred = tot_mdl.predict(X_test)

sp_mae  = float(np.mean(np.abs(sp_pred  - y_spread_test)))
tot_mae = float(np.mean(np.abs(tot_pred - y_total_test)))

# Also compute in-sample (all-data) MAE so we can compare
X_all = df[KFEATS].values
sp_mdl_all  = XGBRegressor(**REG_P).fit(X_all, df["actual_spread"].abs().values)
tot_mdl_all = XGBRegressor(**REG_P).fit(X_all, df["actual_total"].values)
sp_mae_is   = float(np.mean(np.abs(sp_mdl_all.predict(X_test)  - y_spread_test)))
tot_mae_is  = float(np.mean(np.abs(tot_mdl_all.predict(X_test) - y_total_test)))

# Per-gender breakdown
for label, mask in [("Men's", test.men_women == 1), ("Women's", test.men_women == 0)]:
    sp_g  = float(np.mean(np.abs(sp_pred[mask.values]  - y_spread_test[mask.values])))
    tot_g = float(np.mean(np.abs(tot_pred[mask.values] - y_total_test[mask.values])))
    n     = mask.sum()
    print(f"  {label} ({n} games)  Spread MAE: {sp_g:.2f}  Total MAE: {tot_g:.2f}")

print()
print("=" * 55)
print("  Kaggle Spread / Total — Holdout Evaluation (2024-2025)")
print("=" * 55)
print(f"  {'':30s}  Spread MAE   Total MAE")
print(f"  {'-'*50}")
print(f"  {'Holdout (train 2010-23, test 24-25)':40s}  {sp_mae:6.2f}       {tot_mae:6.2f}")
print(f"  {'In-sample (all data, for reference)':40s}  {sp_mae_is:6.2f}       {tot_mae_is:6.2f}")
print(f"  {'Previously reported (in-sample)':40s}    8.26          10.79")
print("=" * 55)
print()
print("No models were saved. These figures are for reference only.")
