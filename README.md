# March Madness 2026

A machine learning pipeline for predicting NCAA March Madness tournament outcomes and generating Kaggle competition submissions. Covers both the Men's and Women's tournaments.

---

## Overview

This project uses XGBoost models trained on 40+ years of NCAA game data to predict tournament game outcomes. It produces win probabilities for all possible team matchups and simulates the full bracket round-by-round.

**2026 Results:**
- Men's predicted champion: Duke (Seed 1, Region W)
- Win prediction accuracy on 2024–2025 test data: **75.78%**
- Submission covers 132,133 matchup pairs

---

## Project Structure

```
MARCH_MADNESS_2026/
├── Notebooks (Men's pipeline)
│   ├── 1_cleaning_2026.ipynb       # Data cleaning & feature engineering
│   ├── 2_train_2026.ipynb          # Model training (with seeds)
│   ├── 3_scores_2026.ipynb         # Score/spread prediction models
│   ├── 4_no_seed_2026.ipynb        # Model training (without seeds)
│   └── 5_submission.ipynb          # Generate Kaggle submission CSV
│
├── Notebooks (Women's pipeline)
│   ├── W1_cleaning_2026.ipynb
│   ├── W2_train_2026.ipynb
│   ├── W3_scores_2026.ipynb
│   ├── W4_no_seed_2026.ipynb
│   └── W5_submission.ipynb
│
├── data_2026/                      # Input data & generated features
│   ├── MRegularSeasonDetailedResults.csv
│   ├── MNCAATourneyDetailedResults.csv
│   ├── MNCAATourneySeeds.csv
│   ├── MTeams.csv
│   ├── MTeamConferences.csv
│   ├── MConferenceTourneyGames.csv
│   ├── SampleSubmissionStage2.csv  # 132,133 matchup pairs to score
│   ├── final_season_stats.csv      # Generated: aggregated 2026 team stats
│   ├── final_features.csv          # Generated: historical training dataset
│   └── [W* equivalents for Women's]
│
├── model/                          # Saved trained models
│   ├── march_madness_model.joblib      # Win classifier (with seeds)
│   ├── march_madness_model_no_seed.joblib
│   ├── spread_model.joblib             # Point spread regressor
│   ├── total_model.joblib              # Total score regressor
│   └── [no_seed variants]
│
├── submission_2026.csv             # Men's predictions output
├── submission_2026_W.csv           # Women's predictions output
├── submission_2026_combined.csv    # Combined M+W submission
├── pyproject.toml
└── uv.lock
```

---

## Pipeline

### Step 1 — Data Cleaning & Feature Engineering (`1_cleaning_2026.ipynb`)

Loads historical NCAA data (2003–2025) and builds a feature-rich training dataset.

- Aggregates regular season game results into per-team season statistics: scoring, shooting percentages (FG%, 3P%, FT%), rebounds, assists, blocks, steals, turnovers, and margin-of-victory metrics
- Adds win/loss location splits (home/away/neutral), conference tournament champion indicators, and one-hot encoded conference membership
- Joins team stats to historical tournament game results
- Outputs `final_features.csv` (1,436 games × 114 features) and `final_season_stats.csv`

### Step 2 — Model Training with Seeds (`2_train_2026.ipynb`)

Trains XGBoost models on historical tournament data (2010–2023).

- **Three models trained:**
  1. Win classifier — predicts which team wins (binary)
  2. Spread model — predicts winning margin (regression)
  3. Total score model — predicts combined score (regression)
- Data is augmented by swapping W/L team roles to create a balanced training set
- Hyperparameters tuned via GridSearchCV (5-fold CV)
- Test set is 2024–2025 tournament games

**Model performance (Men's, with seeds):**

| Model | Metric | Value |
|---|---|---|
| Win classifier | Accuracy | 75.78% |
| Spread model | MAE | 10.41 pts |
| Total score model | MAE | 12.82 pts |

### Step 3 — Score Models (`3_scores_2026.ipynb`)

Trains dedicated regression models focused on score prediction accuracy.

### Step 4 — No-Seed Model (`4_no_seed_2026.ipynb`)

Trains the same architecture but excludes seed information from features. Accuracy drops to **65.62%**, showing seeds account for ~10 percentage points of predictive power.

### Step 5 — Submission (`5_submission.ipynb`)

- Loads the 132,133 team-pair matchups from `SampleSubmissionStage2.csv`
- Joins 2026 season stats to each team (missing stats filled with column medians)
- Runs the trained model to produce P(Team1 beats Team2) for every pair
- Simulates the full bracket round-by-round: play-in → Round of 64 → 32 → Sweet 16 → Elite 8 → Final Four → Championship
- Outputs `submission_2026.csv`

---

## Setup & Running

This project uses [uv](https://github.com/astral-sh/uv) for dependency management.

```bash
# Install dependencies
uv sync

# Launch Jupyter
uv run jupyter lab
```

Run notebooks in order (1 → 2 → 3 → 4 → 5) for the Men's pipeline, and W1 → W5 for the Women's pipeline.

**Requirements:** Python 3.11+, pandas, numpy, scikit-learn, xgboost, lightgbm, matplotlib, seaborn, jupyter

---

## Key Design Decisions

- **Train on 2010+ data only** — avoids older seasons with different NCAA rules
- **Data augmentation** — swapping winner/loser roles doubles training data and balances classes
- **Conference one-hot encoding** — captures conference strength differences
- **Feature aggregation** — uses mean/median/stddev rather than raw game stats for robustness
- **Seed vs. no-seed models** — dual models allow ensemble strategies and quantify seed impact
- **Median imputation** — handles teams with no 2026 season data gracefully
