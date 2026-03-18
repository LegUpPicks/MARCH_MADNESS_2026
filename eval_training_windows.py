"""
Compare balanced vs unbalanced per-round model performance
across two training windows: 2003-2023 and 2010-2023.
Holdout: 2024-2025 (fair test: W = lower seed / favorite).
"""
import warnings, os
import numpy as np
import pandas as pd
from xgboost import XGBClassifier, XGBRegressor
warnings.filterwarnings('ignore')

BASE     = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, 'data_2026')

NON_FEATURE_COLS = {"SEASON", "WIN_INDICATOR", "L_TEAMID", "W_TEAMID",
                    "W_SCORE", "L_SCORE", "ROUND", "L_REGION", "W_REGION"}
DROP_COLS = ["W_CTWINS", "W_AVERAGECTSCORE", "L_CTWINS", "L_AVERAGECTSCORE",
             "W_WLOCN", "W_WLOCH", "W_WLOCA", "L_WLOCN", "L_WLOCH", "L_WLOCA"]
UPSET_SEED_DIFF = 5

WIN_P = dict(learning_rate=0.1, max_depth=4, min_child_weight=4, n_estimators=100, eval_metric="logloss")
REG_P = dict(learning_rate=0.1, max_depth=3, min_child_weight=2, n_estimators=100, eval_metric="rmse")

ROUND_NAMES = {0: 'Play-In', 1: 'R64', 2: 'R32', 3: 'S16', 4: 'E8', 5: 'FF', 6: 'Champ'}


def load_csv(csv_path):
    final = (
        pd.read_csv(csv_path)
        .rename(columns={"WTEAMID":"W_TEAMID","LTEAMID":"L_TEAMID","WSCORE":"W_SCORE","LSCORE":"L_SCORE"})
    )
    final = final.drop(columns=[c for c in DROP_COLS if c in final.columns])
    feat_cols = [c for c in final.columns if c not in NON_FEATURE_COLS]
    return final, feat_cols


def augment(df):
    w_cols = sorted([c for c in df.columns if c.startswith("W_")])
    l_cols = ["L_" + c[2:] for c in w_cols]
    swapped = df.copy()
    for wc, lc in zip(w_cols, l_cols):
        swapped[wc] = df[lc]; swapped[lc] = df[wc]
    out = pd.concat([df, swapped], ignore_index=True)
    out["WIN_INDICATOR"] = (out["W_SCORE"] > out["L_SCORE"]).astype(int)
    return out


def make_fair_test(df):
    """Reorient rows so W = lower seed (favorite). Mirrors evaluation in bracket_rounds_local_2026."""
    df = df.copy()
    needs_flip = df["W_SEED"] > df["L_SEED"]
    w_cols = sorted([c for c in df.columns if c.startswith("W_")])
    l_cols = ["L_" + c[2:] for c in w_cols]
    for wc, lc in zip(w_cols, l_cols):
        orig_w = df[wc].copy()
        df.loc[needs_flip, wc] = df.loc[needs_flip, lc]
        df.loc[needs_flip, lc] = orig_w[needs_flip]
    df["WIN_INDICATOR"] = 1  # W is always the favorite → correct prediction = 1
    return df


def train_models(train_df, feat_cols, balanced):
    round_models = {}
    for r in range(0, 7):
        rt = train_df[train_df.ROUND == r]
        if len(rt) < 5:
            continue
        X   = rt[feat_cols]
        y   = rt["WIN_INDICATOR"]
        spw = 1.0
        sample_w = None
        if balanced:
            seed_diff = rt["W_SEED"] - rt["L_SEED"]
            n_upsets  = ((seed_diff >= UPSET_SEED_DIFF) & (y == 1)).sum()
            n_non     = len(rt) - n_upsets
            spw = round(n_non / n_upsets, 2) if n_upsets > 0 else 1.0
            sample_w  = np.where((seed_diff >= UPSET_SEED_DIFF) & (y == 1), spw, 1.0)
        round_models[r] = {
            "win":    XGBClassifier(scale_pos_weight=spw, **WIN_P).fit(X, y),
            "spread": XGBRegressor(**REG_P).fit(X, rt["W_SCORE"] - rt["L_SCORE"], sample_weight=sample_w),
            "total":  XGBRegressor(**REG_P).fit(X, rt["W_SCORE"] + rt["L_SCORE"],  sample_weight=sample_w),
        }
    return round_models


def evaluate(round_models, feat_cols, test_df):
    rows = []
    for r, rm in round_models.items():
        rt = test_df[test_df.ROUND == r]
        if len(rt) == 0:
            continue
        X = rt.reindex(columns=feat_cols, fill_value=0)
        proba     = rm["win"].predict_proba(X)[:, 1]
        win_pred  = (proba >= 0.5).astype(int)
        spread_pred = rm["spread"].predict(X)
        total_pred  = rm["total"].predict(X)
        spread_act  = rt["W_SCORE"] - rt["L_SCORE"]
        total_act   = rt["W_SCORE"] + rt["L_SCORE"]
        win_acc     = (win_pred == rt["WIN_INDICATOR"].values).mean() * 100
        spread_mae  = np.abs(spread_pred - spread_act.values).mean()
        total_mae   = np.abs(total_pred  - total_act.values).mean()
        rows.append(dict(round=r, n=len(rt), win_acc=win_acc,
                         spread_mae=spread_mae, total_mae=total_mae))
    return rows


def run_window(csv_path, train_start, label):
    final, feat_cols = load_csv(csv_path)

    # Training set
    train_raw = final[(final.SEASON >= train_start) & (final.SEASON <= 2023)].copy()
    train_aug = augment(train_raw)

    # Test set — fair orientation
    test_raw  = final[final.SEASON.isin([2024, 2025])].copy()
    test_fair = make_fair_test(test_raw)

    results = {}
    for balanced, bname in [(False, "unbalanced"), (True, "balanced")]:
        rm = train_models(train_aug, feat_cols, balanced)
        per_round = evaluate(rm, feat_cols, test_fair)
        results[bname] = per_round

    return results


def summarize(per_round_rows):
    if not per_round_rows:
        return dict(n=0, win_acc=float('nan'), spread_mae=float('nan'), total_mae=float('nan'))
    total_n     = sum(r['n'] for r in per_round_rows)
    win_correct = sum(r['win_acc']/100 * r['n'] for r in per_round_rows)
    spread_sum  = sum(r['spread_mae'] * r['n'] for r in per_round_rows)
    total_sum   = sum(r['total_mae']  * r['n'] for r in per_round_rows)
    return dict(
        n=total_n,
        win_acc=win_correct / total_n * 100,
        spread_mae=spread_sum / total_n,
        total_mae=total_sum  / total_n,
    )


def print_results(label, window_label, per_round, bname):
    s = summarize(per_round)
    print(f"\n{'-'*60}")
    print(f"  {label} | {window_label} | {bname}")
    print(f"{'-'*60}")
    print(f"  {'Round':<10} {'N':>4}  {'WinAcc%':>8}  {'SprdMAE':>8}  {'TotalMAE':>9}")
    for r in sorted(per_round, key=lambda x: x['round']):
        rname = ROUND_NAMES.get(r['round'], str(r['round']))
        print(f"  {rname:<10} {r['n']:>4}  {r['win_acc']:>7.2f}%  {r['spread_mae']:>8.2f}  {r['total_mae']:>9.2f}")
    print(f"  {'Overall':<10} {s['n']:>4}  {s['win_acc']:>7.2f}%  {s['spread_mae']:>8.2f}  {s['total_mae']:>9.2f}")


print("=" * 60)
print("  Holdout: 2024-2025 | Fair test (W = lower seed/fav)")
print("=" * 60)

for label, csv in [("Men", "final_features.csv"), ("Women", "final_features_W.csv")]:
    csv_path = os.path.join(DATA_DIR, csv)
    for train_start, window_label in [(2003, "Train 2003-2023"), (2010, "Train 2010-2023")]:
        res = run_window(csv_path, train_start, window_label)
        for bname, per_round in res.items():
            print_results(label, window_label, per_round, bname)

print()
