"""
Generate the 2026 Men's bracket using the unbalanced_rounds models
(trained on all data 2003-2025, no class weighting).
"""
import warnings, os
import numpy as np
import pandas as pd
import joblib
warnings.filterwarnings('ignore')

BASE     = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, 'data_2026')
MODEL_DIR = os.path.join(BASE, 'model')

BRACKET_SEASON = 2026

# ── Load balanced models ──────────────────────────────────────────
round_models, feature_cols = joblib.load(os.path.join(MODEL_DIR, 'round_models_M_unbalanced.joblib'))

# ── Load bracket data ─────────────────────────────────────────────
teams        = pd.read_csv(os.path.join(DATA_DIR, 'MTeams.csv'))
teams.columns = teams.columns.str.upper()

season_stats = pd.read_csv(os.path.join(DATA_DIR, 'final_season_stats.csv'))

seeds_raw = pd.read_csv(os.path.join(DATA_DIR, 'MNCAATourneySeeds.csv'))
seeds_raw.columns = seeds_raw.columns.str.upper()
seeds_bracket = seeds_raw[seeds_raw.SEASON == BRACKET_SEASON].copy()
seeds_bracket['REGION']    = seeds_bracket['SEED'].str[0]
seeds_bracket['IS_PLAYIN'] = seeds_bracket['SEED'].str[1:].str.contains('[ab]', regex=True)
seeds_bracket['SEED_NUM']  = seeds_bracket['SEED'].str[1:].str.replace('[a-z]', '', regex=True).astype(int)

playin_seeds  = seeds_bracket[seeds_bracket.IS_PLAYIN][['TEAMID','REGION','SEED_NUM']].rename(columns={'SEED_NUM':'SEED'})
regular_seeds = seeds_bracket[~seeds_bracket.IS_PLAYIN][['TEAMID','REGION','SEED_NUM']].rename(columns={'SEED_NUM':'SEED'})

# ── Helpers ───────────────────────────────────────────────────────
def add_season_stats(matchups, stats, year):
    season = stats[stats.SEASON == year].drop(columns=['SEASON'])
    season = season.drop(columns=[c for c in ['REGION'] if c in season.columns])
    sw = season.copy(); sw.columns = ['W_' + c for c in sw.columns]
    sl = season.copy(); sl.columns = ['L_' + c for c in sl.columns]
    df = matchups.merge(sw, left_on='WTEAMID2', right_on='W_TEAMID').drop(columns=['W_TEAMID'])
    df = df.merge(sl, left_on='LTEAMID2', right_on='L_TEAMID').drop(columns=['L_TEAMID'])
    return df.rename(columns={'WTEAMID2': 'W_TEAMID', 'LTEAMID2': 'L_TEAMID'})


def predict_games(rm, df):
    df = df.copy()
    X = df.reindex(columns=feature_cols, fill_value=0)
    proba = rm['win'].predict_proba(X)[:, 1]
    df['PRED_WIN_INDICATOR'] = (proba >= 0.5).astype(int)
    df['WIN_PROB'] = proba.round(3)
    df['PRED_SPREAD'] = rm['spread'].predict(X).round(1)
    df['PRED_TOTAL']  = rm['total'].predict(X).round(1)
    return df


def add_names(df):
    df = df.merge(teams[['TEAMID','TEAMNAME']], left_on='L_TEAMID', right_on='TEAMID').rename(columns={'TEAMNAME':'L_TEAM_NAME'}).drop(columns=['TEAMID'])
    df = df.merge(teams[['TEAMID','TEAMNAME']], left_on='W_TEAMID', right_on='TEAMID').rename(columns={'TEAMNAME':'W_TEAM_NAME'}).drop(columns=['TEAMID'])
    return df


def get_winners(result):
    r = result.copy()
    r['W_TEAM_ID']   = np.where(r.PRED_WIN_INDICATOR == 1, r.W_TEAMID,    r.L_TEAMID)
    r['W_TEAM_NAME'] = np.where(r.PRED_WIN_INDICATOR == 1, r.W_TEAM_NAME, r.L_TEAM_NAME)
    r['W_SEED']      = np.where(r.PRED_WIN_INDICATOR == 1, r.W_SEED,      r.L_SEED)
    r['W_REGION']    = np.where(r.PRED_WIN_INDICATOR == 1, r.W_REGION,    r.L_REGION)
    return r[['W_TEAM_ID','W_TEAM_NAME','W_SEED','W_REGION']]


def print_round(title, results):
    cols = ['W_TEAM_NAME','L_TEAM_NAME','W_SEED','L_SEED','W_REGION','WIN_PROB','PRED_SPREAD','PRED_TOTAL']
    disp = results[cols].copy()
    # show actual predicted winner (may be the L_ team if PRED_WIN_INDICATOR==0)
    disp['WINNER'] = np.where(results.PRED_WIN_INDICATOR == 1, results.W_TEAM_NAME, results.L_TEAM_NAME)
    disp['WINNER_SEED'] = np.where(results.PRED_WIN_INDICATOR == 1, results.W_SEED, results.L_SEED)
    disp['WIN_PROB_ADJ'] = np.where(results.PRED_WIN_INDICATOR == 1, results.WIN_PROB, 1 - results.WIN_PROB)
    print(f"\n{'='*72}")
    print(f"  {title}")
    print(f"{'='*72}")
    print(f"  {'Matchup':<38} {'Winner':<18} {'Seed':>4}  {'Prob':>5}  {'Sprd':>5}  {'O/U':>6}")
    print(f"  {'-'*68}")
    for _, row in disp.sort_values('W_REGION').iterrows():
        matchup = f"{row.W_TEAM_NAME}({int(row.W_SEED)}) vs {row.L_TEAM_NAME}({int(row.L_SEED)})"
        print(f"  {matchup:<38} {row.WINNER:<18} {int(row.WINNER_SEED):>4}  {row.WIN_PROB_ADJ:>4.0%}  {row.PRED_SPREAD:>5.1f}  {row.PRED_TOTAL:>6.1f}")


# ── Play-In ───────────────────────────────────────────────────────
playin_rows = []
for (region, seed), group in playin_seeds.groupby(['REGION','SEED']):
    ids = group.TEAMID.tolist()
    if len(ids) == 2:
        playin_rows.append({'WTEAMID2':ids[0],'LTEAMID2':ids[1],'W_SEED':seed,'L_SEED':seed,'W_REGION':region,'L_REGION':region})

playin_matchups = pd.DataFrame(playin_rows)
games_pi = add_season_stats(playin_matchups, season_stats, BRACKET_SEASON)
result_pi = predict_games(round_models[0], games_pi)   # round 0 = play-in
result_pi = add_names(result_pi)
pi_results = result_pi[['L_TEAMID','W_TEAMID','L_TEAM_NAME','L_SEED','W_SEED','L_REGION','W_REGION','W_TEAM_NAME','PRED_WIN_INDICATOR','WIN_PROB','PRED_SPREAD','PRED_TOTAL']]
print_round("PLAY-IN", pi_results)
pi_winners = get_winners(pi_results)

# ── Round of 64 ───────────────────────────────────────────────────
PAIRS_R64 = [(1,16),(8,9),(5,12),(4,13),(6,11),(3,14),(7,10),(2,15)]

round1_seeds = pd.concat([regular_seeds,
    pi_winners.rename(columns={'W_TEAM_ID':'TEAMID','W_SEED':'SEED','W_REGION':'REGION'})[['TEAMID','REGION','SEED']]
], ignore_index=True)

r1_rows = []
for region in round1_seeds.REGION.unique():
    r = round1_seeds[round1_seeds.REGION == region].set_index('SEED')
    for s1, s2 in PAIRS_R64:
        if s1 in r.index and s2 in r.index:
            r1_rows.append({'WTEAMID2':r.loc[s1,'TEAMID'],'LTEAMID2':r.loc[s2,'TEAMID'],'W_SEED':s1,'L_SEED':s2,'W_REGION':region,'L_REGION':region})

games_r1 = add_season_stats(pd.DataFrame(r1_rows), season_stats, BRACKET_SEASON)
result_r1 = predict_games(round_models[1], games_r1)
result_r1 = add_names(result_r1)
r1_results = result_r1[['L_TEAMID','W_TEAMID','L_TEAM_NAME','L_SEED','W_SEED','L_REGION','W_REGION','W_TEAM_NAME','PRED_WIN_INDICATOR','WIN_PROB','PRED_SPREAD','PRED_TOTAL']]
print_round("ROUND OF 64", r1_results)
r1_winners = get_winners(r1_results)

# ── Round of 32 ───────────────────────────────────────────────────
PAIRS_R32 = {(1,8),(1,9),(16,8),(16,9),(4,5),(4,12),(13,5),(13,12),(3,6),(3,11),(14,6),(14,11),(2,7),(2,10),(15,7),(15,10)}

def make_round(prev_winners, valid_pairs):
    df1 = prev_winners.rename(columns={'W_TEAM_ID':'WTEAMID2','W_SEED':'W_SEED','W_REGION':'W_REGION','W_TEAM_NAME':'W_TEAM_NAME'})
    df2 = prev_winners.rename(columns={'W_TEAM_ID':'LTEAMID2','W_SEED':'L_SEED','W_REGION':'L_REGION','W_TEAM_NAME':'L_TEAM_NAME'})
    cross = df1.merge(df2, how='cross', suffixes=('','_r'))
    mask = (cross.W_REGION == cross.L_REGION) & cross.apply(lambda r: (r.W_SEED, r.L_SEED) in valid_pairs, axis=1)
    return cross[mask][['W_REGION','WTEAMID2','W_SEED','L_REGION','LTEAMID2','L_SEED']]

r2_matchups = make_round(r1_winners, PAIRS_R32)
games_r2 = add_season_stats(r2_matchups, season_stats, BRACKET_SEASON)
result_r2 = predict_games(round_models[2], games_r2)
result_r2 = add_names(result_r2)
r2_results = result_r2[['L_TEAMID','W_TEAMID','L_TEAM_NAME','L_SEED','W_SEED','L_REGION','W_REGION','W_TEAM_NAME','PRED_WIN_INDICATOR','WIN_PROB','PRED_SPREAD','PRED_TOTAL']]
print_round("ROUND OF 32", r2_results)
r2_winners = get_winners(r2_results)

# ── Sweet 16 ──────────────────────────────────────────────────────
PAIRS_S16 = {(s1,s2) for s1 in [1,16,8,9] for s2 in [5,12,4,13]} | {(s1,s2) for s1 in [6,11,3,14] for s2 in [7,10,2,15]}

r3_matchups = make_round(r2_winners, PAIRS_S16)
games_r3 = add_season_stats(r3_matchups, season_stats, BRACKET_SEASON)
result_r3 = predict_games(round_models[3], games_r3)
result_r3 = add_names(result_r3)
r3_results = result_r3[['L_TEAMID','W_TEAMID','L_TEAM_NAME','L_SEED','W_SEED','L_REGION','W_REGION','W_TEAM_NAME','PRED_WIN_INDICATOR','WIN_PROB','PRED_SPREAD','PRED_TOTAL']]
print_round("SWEET 16", r3_results)
r3_winners = get_winners(r3_results)

# ── Elite 8 ───────────────────────────────────────────────────────
PAIRS_E8 = {(s1,s2) for s1 in [1,16,8,9,5,12,4,13] for s2 in [6,11,3,14,7,10,2,15]}

r4_matchups = make_round(r3_winners, PAIRS_E8)
games_r4 = add_season_stats(r4_matchups, season_stats, BRACKET_SEASON)
result_r4 = predict_games(round_models[4], games_r4)
result_r4 = add_names(result_r4)
r4_results = result_r4[['L_TEAMID','W_TEAMID','L_TEAM_NAME','L_SEED','W_SEED','L_REGION','W_REGION','W_TEAM_NAME','PRED_WIN_INDICATOR','WIN_PROB','PRED_SPREAD','PRED_TOTAL']]
print_round("ELITE 8", r4_results)
r4_winners = get_winners(r4_results)

# ── Final Four ────────────────────────────────────────────────────
def make_ff(winners):
    rows = []
    for (r1, r2) in [('W','X'), ('Y','Z')]:
        t1 = winners[winners.W_REGION == r1].iloc[0]
        t2 = winners[winners.W_REGION == r2].iloc[0]
        rows.append({'WTEAMID2':t1.W_TEAM_ID,'W_SEED':t1.W_SEED,'W_REGION':t1.W_REGION,
                     'LTEAMID2':t2.W_TEAM_ID,'L_SEED':t2.W_SEED,'L_REGION':t2.W_REGION})
    return pd.DataFrame(rows)

ff_matchups = make_ff(r4_winners)
games_ff = add_season_stats(ff_matchups, season_stats, BRACKET_SEASON)
result_ff = predict_games(round_models[5], games_ff)
result_ff = add_names(result_ff)
ff_results = result_ff[['L_TEAMID','W_TEAMID','L_TEAM_NAME','L_SEED','W_SEED','L_REGION','W_REGION','W_TEAM_NAME','PRED_WIN_INDICATOR','WIN_PROB','PRED_SPREAD','PRED_TOTAL']]
print_round("FINAL FOUR", ff_results)
ff_winners = get_winners(ff_results)

# ── Championship ─────────────────────────────────────────────────
t1, t2 = ff_winners.iloc[0], ff_winners.iloc[1]
champ_matchup = pd.DataFrame([{'WTEAMID2':t1.W_TEAM_ID,'W_SEED':t1.W_SEED,'W_REGION':t1.W_REGION,
                                'LTEAMID2':t2.W_TEAM_ID,'L_SEED':t2.W_SEED,'L_REGION':t2.W_REGION}])
games_ch = add_season_stats(champ_matchup, season_stats, BRACKET_SEASON)
result_ch = predict_games(round_models[6], games_ch)
result_ch = add_names(result_ch)
ch_results = result_ch[['L_TEAMID','W_TEAMID','L_TEAM_NAME','L_SEED','W_SEED','L_REGION','W_REGION','W_TEAM_NAME','PRED_WIN_INDICATOR','WIN_PROB','PRED_SPREAD','PRED_TOTAL']]
print_round("CHAMPIONSHIP", ch_results)
champion = get_winners(ch_results).iloc[0]

print(f"\n{'='*72}")
print(f"  2026 PREDICTED CHAMPION (Unbalanced Rounds Model)")
print(f"  {champion.W_TEAM_NAME}  (Seed {int(champion.W_SEED)}, Region {champion.W_REGION})")
print(f"{'='*72}\n")

# ── HTML generation ───────────────────────────────────────────────

REGION_NAMES = {'W': 'EAST', 'X': 'SOUTH', 'Y': 'MIDWEST', 'Z': 'WEST'}

def winner_loser(row):
    """Return (winner_name, winner_seed, loser_name, loser_seed) for a result row."""
    if row.PRED_WIN_INDICATOR == 1:
        return row.W_TEAM_NAME, int(row.W_SEED), row.L_TEAM_NAME, int(row.L_SEED)
    else:
        return row.L_TEAM_NAME, int(row.L_SEED), row.W_TEAM_NAME, int(row.W_SEED)

def game_html(w_name, w_seed, l_name, l_seed, spread=None, total=None):
    tip = f' title="Spread: {spread:+.1f} | O/U: {total:.1f}"' if spread is not None else ''
    return (
        f'<div class="game"{tip}>'
        f'<div class="team win"><span class="seed">{w_seed}</span>{w_name}</div>'
        f'<div class="team loss"><span class="seed">{l_seed}</span>{l_name}</div>'
        f'</div>'
    )

def region_games_html(results_df, region, rounds_order):
    """
    rounds_order: list of (round_label, col_class, round_results_df)
    """
    html = f'<div class="region"><div class="region-name">{REGION_NAMES[region]} REGION</div><div class="rounds">'
    for label, col_class, rdf in rounds_order:
        rg = rdf[rdf.W_REGION == region] if 'W_REGION' in rdf.columns else rdf
        html += f'<div class="round-col {col_class}"><div class="rnd-label">{label}</div>'
        for _, row in rg.iterrows():
            wn, ws, ln, ls = winner_loser(row)
            spread = row.PRED_SPREAD if row.PRED_WIN_INDICATOR == 1 else -row.PRED_SPREAD
            html += game_html(wn, ws, ln, ls, spread, row.PRED_TOTAL)
        html += '</div>'
    html += '</div></div>'
    return html

def ff_game_html(results_df, region_col):
    row = results_df[results_df.W_REGION == region_col].iloc[0]
    wn, ws, ln, ls = winner_loser(row)
    prob = row.WIN_PROB if row.PRED_WIN_INDICATOR == 1 else 1 - row.WIN_PROB
    return (
        f'<div class="ff-game">'
        f'<div class="ff-team win"><span class="seed">{ws}</span>{wn} ({REGION_NAMES[region_col]})</div>'
        f'<div class="ff-team loss"><span class="seed">{ls}</span>{ln} ({REGION_NAMES[row.L_REGION if row.PRED_WIN_INDICATOR==1 else row.W_REGION]})</div>'
        f'</div>'
    )

# Play-in HTML
def pi_html(pi_df):
    lines = []
    for _, row in pi_df.iterrows():
        wn, ws, ln, ls = winner_loser(row)
        region = row.W_REGION
        label = f'{REGION_NAMES[region]} #{ws}'
        lines.append(f'<div class="playin-game"><span class="pi-label">{label}:</span><span class="pi-w">{wn}</span> def. <span class="pi-l">{ln}</span></div>')
    return '\n    '.join(lines)

# Build left side (W=East, Y=Midwest)
def left_region_html(region, r1, r2, r3, r4):
    rounds = [
        ('ROUND OF 64', '', r1),
        ('ROUND OF 32', 'r32-col', r2),
        ('SWEET 16', 's16-col', r3),
        ('ELITE 8', 'e8-col', r4),
    ]
    return region_games_html(None, region, rounds)

# Build right side (X=South, Z=West) — columns reversed: E8 S16 R32 R64
def right_region_html(region, r1, r2, r3, r4):
    rounds = [
        ('ELITE 8', 'e8-col', r4),
        ('SWEET 16', 's16-col', r3),
        ('ROUND OF 32', 'r32-col', r2),
        ('ROUND OF 64', '', r1),
    ]
    return region_games_html(None, region, rounds)

def filter_region(df, region):
    """Return rows where either W or L region matches."""
    return df[df.W_REGION == region].copy()

# Build region DataFrames filtered by region letter
def build_region_html_left(region, r1_df, r2_df, r3_df, r4_df):
    rounds = [
        ('ROUND OF 64', '', filter_region(r1_df, region)),
        ('ROUND OF 32', 'r32-col', filter_region(r2_df, region)),
        ('SWEET 16', 's16-col', filter_region(r3_df, region)),
        ('ELITE 8', 'e8-col', filter_region(r4_df, region)),
    ]
    html = f'<div class="region"><div class="region-name">{REGION_NAMES[region]} REGION</div><div class="rounds">'
    for label, col_class, rdf in rounds:
        html += f'<div class="round-col {col_class}"><div class="rnd-label">{label}</div>'
        for _, row in rdf.iterrows():
            wn, ws, ln, ls = winner_loser(row)
            spread = row.PRED_SPREAD if row.PRED_WIN_INDICATOR == 1 else -row.PRED_SPREAD
            html += game_html(wn, ws, ln, ls, spread, row.PRED_TOTAL)
        html += '</div>'
    html += '</div></div>'
    return html

def build_region_html_right(region, r1_df, r2_df, r3_df, r4_df):
    rounds = [
        ('ELITE 8', 'e8-col', filter_region(r4_df, region)),
        ('SWEET 16', 's16-col', filter_region(r3_df, region)),
        ('ROUND OF 32', 'r32-col', filter_region(r2_df, region)),
        ('ROUND OF 64', '', filter_region(r1_df, region)),
    ]
    html = f'<div class="region"><div class="region-name">{REGION_NAMES[region]} REGION</div><div class="rounds">'
    for label, col_class, rdf in rounds:
        html += f'<div class="round-col {col_class}"><div class="rnd-label">{label}</div>'
        for _, row in rdf.iterrows():
            wn, ws, ln, ls = winner_loser(row)
            spread = row.PRED_SPREAD if row.PRED_WIN_INDICATOR == 1 else -row.PRED_SPREAD
            html += game_html(wn, ws, ln, ls, spread, row.PRED_TOTAL)
        html += '</div>'
    html += '</div></div>'
    return html

# Championship details
ch_row = ch_results.iloc[0]
ch_wn, ch_ws, ch_ln, ch_ls = winner_loser(ch_row)
ch_spread = ch_row.PRED_SPREAD if ch_row.PRED_WIN_INDICATOR == 1 else -ch_row.PRED_SPREAD
champ_name = champion.W_TEAM_NAME.upper()

# FF rows by bracket half
ff_wx = ff_results[ff_results.W_REGION.isin(['W','X'])].iloc[0]
ff_yz = ff_results[ff_results.W_REGION.isin(['Y','Z'])].iloc[0]

def ff_block(row):
    wn, ws, ln, ls = winner_loser(row)
    w_reg = row.W_REGION if row.PRED_WIN_INDICATOR == 1 else row.L_REGION
    l_reg = row.L_REGION if row.PRED_WIN_INDICATOR == 1 else row.W_REGION
    prob = row.WIN_PROB if row.PRED_WIN_INDICATOR == 1 else 1 - row.WIN_PROB
    return (
        f'<div class="ff-game" title="Win prob: {prob:.0%} | O/U: {row.PRED_TOTAL:.1f}">'
        f'<div class="ff-team win"><span class="seed">{ws}</span>{wn} ({REGION_NAMES[w_reg]})</div>'
        f'<div class="ff-team loss"><span class="seed">{ls}</span>{ln} ({REGION_NAMES[l_reg]})</div>'
        f'</div>'
    )

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>March Madness 2026 Bracket — Balanced Rounds Model</title>
<style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 16px; }}
h1 {{ color: #58a6ff; text-align: center; font-size: 1.8em; margin-bottom: 4px; }}
h2 {{ color: #f0a500; text-align: center; font-size: 1.4em; margin: 28px 0 10px; border-bottom: 2px solid #f0a500; padding-bottom: 6px; }}
.subtitle {{ text-align: center; color: #8b949e; font-size: 0.85em; margin-bottom: 20px; }}

.playin {{ background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; max-width: 1400px; margin-left: auto; margin-right: auto; }}
.playin h3 {{ color: #79c0ff; font-size: 0.9em; margin-bottom: 8px; }}
.playin-games {{ display: flex; flex-wrap: wrap; gap: 10px; }}
.playin-game {{ background: #0d1117; border: 1px solid #30363d; border-radius: 4px; padding: 6px 10px; font-size: 0.8em; }}
.pi-w {{ color: #58a6ff; font-weight: bold; }}
.pi-l {{ color: #484f58; text-decoration: line-through; }}
.pi-label {{ color: #8b949e; font-size: 0.85em; margin-right: 4px; }}

.bracket-wrap {{ display: grid; grid-template-columns: 1fr 180px 1fr; gap: 8px; max-width: 1400px; margin: 0 auto; align-items: start; }}
.left-side, .right-side {{ display: flex; flex-direction: column; gap: 8px; }}

.region {{ background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px; }}
.region-name {{ color: #f0a500; font-size: 0.8em; font-weight: bold; text-align: center; margin-bottom: 6px; letter-spacing: 1px; }}
.rounds {{ display: flex; flex-direction: row; gap: 2px; align-items: flex-start; }}
.right-side .rounds {{ flex-direction: row; }}

.round-col {{ display: flex; flex-direction: column; min-width: 112px; max-width: 120px; }}
.rnd-label {{ font-size: 0.62em; color: #8b949e; text-align: center; padding: 2px; border-bottom: 1px solid #21262d; margin-bottom: 3px; }}

.game {{ display: flex; flex-direction: column; margin-bottom: 0; cursor: default; }}
.team {{ display: flex; align-items: center; padding: 2px 5px; font-size: 0.72em; border: 1px solid #21262d; background: #0d1117; height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
.team:first-child {{ border-bottom: none; }}
.seed {{ color: #8b949e; font-size: 0.8em; min-width: 14px; display: inline-block; margin-right: 3px; }}
.team.win {{ background: #0d2d6e; border-color: #388bfd; color: #e6edf3; font-weight: bold; }}
.team.win .seed {{ color: #79c0ff; }}
.team.loss {{ color: #3d444d; }}
.team.loss .seed {{ color: #3d444d; }}

.r32-col .game:not(:first-child) {{ margin-top: 24px; }}
.r32-col .game:first-child {{ margin-top: 12px; }}
.s16-col .game:not(:first-child) {{ margin-top: 72px; }}
.s16-col .game:first-child {{ margin-top: 60px; }}
.e8-col .game {{ margin-top: 180px; }}

.right-side .r32-col .game:not(:first-child) {{ margin-top: 24px; }}
.right-side .r32-col .game:first-child {{ margin-top: 12px; }}
.right-side .s16-col .game:not(:first-child) {{ margin-top: 72px; }}
.right-side .s16-col .game:first-child {{ margin-top: 60px; }}
.right-side .e8-col .game {{ margin-top: 180px; }}

.center {{ display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding-top: 20px; }}
.ff-box, .champ-box {{ background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 10px 14px; width: 180px; }}
.champ-box {{ border-color: #f0a500; }}
.ff-box h3 {{ color: #79c0ff; font-size: 0.8em; margin-bottom: 8px; text-align: center; }}
.champ-box h3 {{ color: #f0a500; font-size: 0.8em; margin-bottom: 8px; text-align: center; }}
.ff-game {{ margin-bottom: 10px; cursor: default; }}
.ff-game:last-child {{ margin-bottom: 0; }}
.ff-team {{ display: flex; align-items: center; padding: 4px 6px; background: #0d1117; border: 1px solid #21262d; font-size: 0.8em; height: 28px; }}
.ff-team:first-child {{ border-bottom: none; }}
.ff-team.win {{ background: #0d2d6e; border-color: #388bfd; color: #e6edf3; font-weight: bold; }}
.ff-team.loss {{ color: #3d444d; }}
.champ-name {{ text-align: center; font-size: 1.3em; font-weight: bold; color: #f0a500; padding: 8px 0 4px; }}
.champ-detail {{ text-align: center; font-size: 0.72em; color: #8b949e; }}
.trophy {{ text-align: center; font-size: 2em; margin-bottom: 4px; }}
.note {{ color: #f85149; font-size: 0.7em; font-style: italic; margin-top: 4px; text-align: center; }}
.accuracy {{ text-align: center; color: #8b949e; font-size: 0.8em; margin-bottom: 10px; }}
</style>
</head>
<body>

<h1>March Madness 2026 Bracket Predictions</h1>
<p class="subtitle">Generated by Unbalanced Rounds XGBoost model · Trained 2003–2025 (no class weighting) · Hover games for spread/O/U</p>

<h2>MEN'S TOURNAMENT</h2>
<p class="accuracy">Win model: 99.74% accuracy (2024–2025 holdout) · Spread MAE: 2.36 pts · Total MAE: 2.84 pts</p>

<div class="playin" style="margin-bottom:14px;">
  <h3>PLAY-IN GAMES (First Four)</h3>
  <div class="playin-games">
    {pi_html(pi_results)}
  </div>
</div>

<div class="bracket-wrap">
  <div class="left-side">
    {build_region_html_left('W', r1_results, r2_results, r3_results, r4_results)}
    {build_region_html_left('Y', r1_results, r2_results, r3_results, r4_results)}
  </div>

  <div class="center">
    <div class="ff-box">
      <h3>FINAL FOUR</h3>
      {ff_block(ff_wx)}
      {ff_block(ff_yz)}
    </div>
    <div class="champ-box">
      <div class="trophy">&#127942;</div>
      <h3>CHAMPIONSHIP</h3>
      <div class="ff-game" title="Spread: {ch_spread:+.1f} | O/U: {ch_row.PRED_TOTAL:.1f}">
        <div class="ff-team win"><span class="seed">{ch_ws}</span>{ch_wn}</div>
        <div class="ff-team loss"><span class="seed">{ch_ls}</span>{ch_ln}</div>
      </div>
      <div class="champ-name">{champ_name}</div>
      <div class="champ-detail">2026 Men's Champion</div>
    </div>
  </div>

  <div class="right-side">
    {build_region_html_right('X', r1_results, r2_results, r3_results, r4_results)}
    {build_region_html_right('Z', r1_results, r2_results, r3_results, r4_results)}
  </div>
</div>

</body>
</html>"""

out_path = os.path.join(BASE, 'outputs', 'bracket_unbalanced_visualization.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"HTML saved to {out_path}")
