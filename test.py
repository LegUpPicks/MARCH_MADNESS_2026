round_2_winners = round_2_results.with_column(
    "W_TEAMID",
    when((round_2_results.WINNER == 1), round_2_results.w_teamid)
    .otherwise(round_2_results.l_teamID),
).with_column(
    "W_TEAM_NAME",
    when((round_2_results.WINNER == 1), round_2_results.w_team_name)
    .otherwise(round_2_results.l_team_name),
).with_column(
    "W_SEED",
    when((round_2_results.WINNER == 1), round_2_results.w_seed)
    .otherwise(round_2_results.l_seed),
).with_column(
    "W_REGION",
    when((round_2_results.WINNER == 1), round_2_results.w_region)
    .otherwise(round_2_results.l_region)
).select("W_TEAMID","W_TEAM_NAME","W_SEED","W_REGION")

round_1_winners.sort('W_REGION').show(32)