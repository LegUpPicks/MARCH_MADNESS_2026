// ============================================================
// 2026 NCAA Tournament Bracket Data
// ============================================================

// ---- MEN'S BRACKET ----

export const mensGames = [
  // --- PLAY-IN GAMES ---
  {
    id: 'M_PI_X16',
    round: 'playin',
    region: 'X',
    topTeam: { name: 'Lehigh', seed: 16 },
    botTeam: { name: 'Prairie View', seed: 16 },
    prediction: { winner: 'Lehigh', spreadRaw: 3.2, winIndicator: 1, total: 137.3 },
    playinSlot: 'X16',
  },
  {
    id: 'M_PI_Y11',
    round: 'playin',
    region: 'Y',
    topTeam: { name: 'Miami OH', seed: 11 },
    botTeam: { name: 'SMU', seed: 11 },
    prediction: { winner: 'SMU', spreadRaw: -2.5, winIndicator: 0, total: 157.6 },
    playinSlot: 'Y11',
  },
  {
    id: 'M_PI_Y16',
    round: 'playin',
    region: 'Y',
    topTeam: { name: 'Howard', seed: 16 },
    botTeam: { name: 'UMBC', seed: 16 },
    prediction: { winner: 'UMBC', spreadRaw: 2.7, winIndicator: 0, total: 152.5 },
    playinSlot: 'Y16',
  },
  {
    id: 'M_PI_Z11',
    round: 'playin',
    region: 'Z',
    topTeam: { name: 'NC State', seed: 11 },
    botTeam: { name: 'Texas', seed: 11 },
    prediction: { winner: 'NC State', spreadRaw: 3.8, winIndicator: 1, total: 154.5 },
    playinSlot: 'Z11',
  },

  // --- ROUND OF 64 - W REGION ---
  {
    id: 'M_W_R64_1v16',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Duke', seed: 1 },
    botTeam: { name: 'Siena', seed: 16 },
    prediction: { winner: 'Duke', spreadRaw: 17.6, winIndicator: 1, total: 140.0 },
    playinSlot: null,
  },
  {
    id: 'M_W_R64_8v9',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Ohio St', seed: 8 },
    botTeam: { name: 'TCU', seed: 9 },
    prediction: { winner: 'TCU', spreadRaw: -2.0, winIndicator: 0, total: 143.6 },
    playinSlot: null,
  },
  {
    id: 'M_W_R64_5v12',
    round: 'r64',
    region: 'W',
    topTeam: { name: "St John's", seed: 5 },
    botTeam: { name: 'N Iowa', seed: 12 },
    prediction: { winner: "St John's", spreadRaw: 4.3, winIndicator: 1, total: 134.7 },
    playinSlot: null,
  },
  {
    id: 'M_W_R64_4v13',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Kansas', seed: 4 },
    botTeam: { name: 'Cal Baptist', seed: 13 },
    prediction: { winner: 'Kansas', spreadRaw: 7.1, winIndicator: 1, total: 138.7 },
    playinSlot: null,
  },
  {
    id: 'M_W_R64_6v11',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Louisville', seed: 6 },
    botTeam: { name: 'S Florida', seed: 11 },
    prediction: { winner: 'Louisville', spreadRaw: 7.0, winIndicator: 1, total: 152.7 },
    playinSlot: null,
  },
  {
    id: 'M_W_R64_3v14',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Michigan St', seed: 3 },
    botTeam: { name: 'N Dakota St', seed: 14 },
    prediction: { winner: 'Michigan St', spreadRaw: 11.1, winIndicator: 1, total: 153.3 },
    playinSlot: null,
  },
  {
    id: 'M_W_R64_7v10',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'UCLA', seed: 7 },
    botTeam: { name: 'UCF', seed: 10 },
    prediction: { winner: 'UCLA', spreadRaw: 1.3, winIndicator: 1, total: 153.3 },
    playinSlot: null,
  },
  {
    id: 'M_W_R64_2v15',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Connecticut', seed: 2 },
    botTeam: { name: 'Furman', seed: 15 },
    prediction: { winner: 'Connecticut', spreadRaw: 13.8, winIndicator: 1, total: 134.4 },
    playinSlot: null,
  },

  // --- ROUND OF 64 - X REGION ---
  {
    id: 'M_X_R64_1v16',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Florida', seed: 1 },
    botTeam: { name: 'Lehigh*', seed: 16 },
    prediction: { winner: 'Florida', spreadRaw: 22.4, winIndicator: 1, total: 146.9 },
    playinSlot: 'X16',
  },
  {
    id: 'M_X_R64_8v9',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Clemson', seed: 8 },
    botTeam: { name: 'Iowa', seed: 9 },
    prediction: { winner: 'Clemson', spreadRaw: 0.2, winIndicator: 1, total: 130.7 },
    playinSlot: null,
  },
  {
    id: 'M_X_R64_5v12',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Vanderbilt', seed: 5 },
    botTeam: { name: 'McNeese St', seed: 12 },
    prediction: { winner: 'Vanderbilt', spreadRaw: 3.7, winIndicator: 1, total: 149.6 },
    playinSlot: null,
  },
  {
    id: 'M_X_R64_4v13',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Nebraska', seed: 4 },
    botTeam: { name: 'Troy', seed: 13 },
    prediction: { winner: 'Nebraska', spreadRaw: 11.8, winIndicator: 1, total: 140.8 },
    playinSlot: null,
  },
  {
    id: 'M_X_R64_6v11',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'N Carolina', seed: 6 },
    botTeam: { name: 'VCU', seed: 11 },
    prediction: { winner: 'N Carolina', spreadRaw: 1.5, winIndicator: 1, total: 146.9 },
    playinSlot: null,
  },
  {
    id: 'M_X_R64_3v14',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Illinois', seed: 3 },
    botTeam: { name: 'Penn', seed: 14 },
    prediction: { winner: 'Illinois', spreadRaw: 8.2, winIndicator: 1, total: 153.2 },
    playinSlot: null,
  },
  {
    id: 'M_X_R64_7v10',
    round: 'r64',
    region: 'X',
    topTeam: { name: "St Mary's CA", seed: 7 },
    botTeam: { name: 'Texas A&M', seed: 10 },
    prediction: { winner: "St Mary's CA", spreadRaw: 5.3, winIndicator: 1, total: 149.4 },
    playinSlot: null,
  },
  {
    id: 'M_X_R64_2v15',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Houston', seed: 2 },
    botTeam: { name: 'Idaho', seed: 15 },
    prediction: { winner: 'Houston', spreadRaw: 18.6, winIndicator: 1, total: 144.3 },
    playinSlot: null,
  },

  // --- ROUND OF 64 - Y REGION ---
  {
    id: 'M_Y_R64_1v16',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Michigan', seed: 1 },
    botTeam: { name: 'UMBC*', seed: 16 },
    prediction: { winner: 'Michigan', spreadRaw: 18.7, winIndicator: 1, total: 147.2 },
    playinSlot: 'Y16',
  },
  {
    id: 'M_Y_R64_8v9',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Georgia', seed: 8 },
    botTeam: { name: 'St Louis', seed: 9 },
    prediction: { winner: 'Georgia', spreadRaw: 1.6, winIndicator: 1, total: 147.9 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R64_5v12',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Texas Tech', seed: 5 },
    botTeam: { name: 'Akron', seed: 12 },
    prediction: { winner: 'Texas Tech', spreadRaw: 2.9, winIndicator: 1, total: 159.2 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R64_4v13',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Alabama', seed: 4 },
    botTeam: { name: 'Hofstra', seed: 13 },
    prediction: { winner: 'Alabama', spreadRaw: 7.5, winIndicator: 1, total: 150.4 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R64_6v11',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Tennessee', seed: 6 },
    botTeam: { name: 'SMU*', seed: 11 },
    prediction: { winner: 'Tennessee', spreadRaw: 2.8, winIndicator: 1, total: 157.0 },
    playinSlot: 'Y11',
  },
  {
    id: 'M_Y_R64_3v14',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Virginia', seed: 3 },
    botTeam: { name: 'Wright St', seed: 14 },
    prediction: { winner: 'Virginia', spreadRaw: 18.0, winIndicator: 1, total: 149.7 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R64_7v10',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Kentucky', seed: 7 },
    botTeam: { name: 'Santa Clara', seed: 10 },
    prediction: { winner: 'Kentucky', spreadRaw: -3.6, winIndicator: 1, total: 152.1 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R64_2v15',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Iowa St', seed: 2 },
    botTeam: { name: 'Tennessee St', seed: 15 },
    prediction: { winner: 'Iowa St', spreadRaw: 18.2, winIndicator: 1, total: 149.3 },
    playinSlot: null,
  },

  // --- ROUND OF 64 - Z REGION ---
  {
    id: 'M_Z_R64_1v16',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Arizona', seed: 1 },
    botTeam: { name: 'LIU Brooklyn', seed: 16 },
    prediction: { winner: 'Arizona', spreadRaw: 18.9, winIndicator: 1, total: 144.0 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R64_8v9',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Villanova', seed: 8 },
    botTeam: { name: 'Utah St', seed: 9 },
    prediction: { winner: 'Villanova', spreadRaw: 0.8, winIndicator: 1, total: 141.2 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R64_5v12',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Wisconsin', seed: 5 },
    botTeam: { name: 'High Point', seed: 12 },
    prediction: { winner: 'Wisconsin', spreadRaw: 4.5, winIndicator: 1, total: 159.4 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R64_4v13',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Arkansas', seed: 4 },
    botTeam: { name: 'Hawaii', seed: 13 },
    prediction: { winner: 'Arkansas', spreadRaw: 7.6, winIndicator: 1, total: 147.7 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R64_6v11',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'BYU', seed: 6 },
    botTeam: { name: 'NC State*', seed: 11 },
    prediction: { winner: 'BYU', spreadRaw: 2.0, winIndicator: 1, total: 158.5 },
    playinSlot: 'Z11',
  },
  {
    id: 'M_Z_R64_3v14',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Gonzaga', seed: 3 },
    botTeam: { name: 'Kennesaw', seed: 14 },
    prediction: { winner: 'Gonzaga', spreadRaw: 16.6, winIndicator: 1, total: 143.0 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R64_7v10',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Miami FL', seed: 7 },
    botTeam: { name: 'Missouri', seed: 10 },
    prediction: { winner: 'Miami FL', spreadRaw: -0.6, winIndicator: 1, total: 139.3 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R64_2v15',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Purdue', seed: 2 },
    botTeam: { name: 'Queens NC', seed: 15 },
    prediction: { winner: 'Purdue', spreadRaw: 16.1, winIndicator: 1, total: 157.4 },
    playinSlot: null,
  },

  // --- ROUND OF 32 ---
  {
    id: 'M_W_R32_1v9',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'Duke', seed: 1 },
    botTeam: { name: 'TCU', seed: 9 },
    prediction: { winner: 'Duke', spreadRaw: 11.8, winIndicator: 1, total: 149.5 },
    playinSlot: null,
  },
  {
    id: 'M_W_R32_4v5',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'Kansas', seed: 4 },
    botTeam: { name: "St John's", seed: 5 },
    prediction: { winner: 'Kansas', spreadRaw: 0.7, winIndicator: 1, total: 150.8 },
    playinSlot: null,
  },
  {
    id: 'M_W_R32_3v6',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'Michigan St', seed: 3 },
    botTeam: { name: 'Louisville', seed: 6 },
    prediction: { winner: 'Michigan St', spreadRaw: -1.4, winIndicator: 1, total: 151.2 },
    playinSlot: null,
  },
  {
    id: 'M_W_R32_2v7',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'Connecticut', seed: 2 },
    botTeam: { name: 'UCLA', seed: 7 },
    prediction: { winner: 'Connecticut', spreadRaw: 2.8, winIndicator: 1, total: 148.1 },
    playinSlot: null,
  },
  {
    id: 'M_X_R32_1v8',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'Florida', seed: 1 },
    botTeam: { name: 'Clemson', seed: 8 },
    prediction: { winner: 'Florida', spreadRaw: 13.3, winIndicator: 1, total: 152.1 },
    playinSlot: null,
  },
  {
    id: 'M_X_R32_4v5',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'Nebraska', seed: 4 },
    botTeam: { name: 'Vanderbilt', seed: 5 },
    prediction: { winner: 'Nebraska', spreadRaw: 0.7, winIndicator: 1, total: 145.6 },
    playinSlot: null,
  },
  {
    id: 'M_X_R32_3v6',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'Illinois', seed: 3 },
    botTeam: { name: 'N Carolina', seed: 6 },
    prediction: { winner: 'Illinois', spreadRaw: 4.0, winIndicator: 1, total: 153.9 },
    playinSlot: null,
  },
  {
    id: 'M_X_R32_2v7',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'Houston', seed: 2 },
    botTeam: { name: "St Mary's CA", seed: 7 },
    prediction: { winner: 'Houston', spreadRaw: 5.3, winIndicator: 1, total: 144.2 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R32_1v8',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'Michigan', seed: 1 },
    botTeam: { name: 'Georgia', seed: 8 },
    prediction: { winner: 'Michigan', spreadRaw: 9.7, winIndicator: 1, total: 152.1 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R32_4v5',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'Alabama', seed: 4 },
    botTeam: { name: 'Texas Tech', seed: 5 },
    prediction: { winner: 'Texas Tech', spreadRaw: -5.2, winIndicator: 0, total: 155.6 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R32_3v6',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'Virginia', seed: 3 },
    botTeam: { name: 'Tennessee', seed: 6 },
    prediction: { winner: 'Virginia', spreadRaw: 2.3, winIndicator: 1, total: 154.5 },
    playinSlot: null,
  },
  {
    id: 'M_Y_R32_2v7',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'Iowa St', seed: 2 },
    botTeam: { name: 'Kentucky', seed: 7 },
    prediction: { winner: 'Iowa St', spreadRaw: 5.3, winIndicator: 1, total: 144.2 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R32_1v8',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'Arizona', seed: 1 },
    botTeam: { name: 'Villanova', seed: 8 },
    prediction: { winner: 'Arizona', spreadRaw: 7.1, winIndicator: 1, total: 139.7 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R32_4v5',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'Arkansas', seed: 4 },
    botTeam: { name: 'Wisconsin', seed: 5 },
    prediction: { winner: 'Arkansas', spreadRaw: -1.2, winIndicator: 1, total: 155.7 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R32_3v6',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'Gonzaga', seed: 3 },
    botTeam: { name: 'BYU', seed: 6 },
    prediction: { winner: 'Gonzaga', spreadRaw: 2.8, winIndicator: 1, total: 145.7 },
    playinSlot: null,
  },
  {
    id: 'M_Z_R32_2v7',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'Purdue', seed: 2 },
    botTeam: { name: 'Miami FL', seed: 7 },
    prediction: { winner: 'Purdue', spreadRaw: 3.7, winIndicator: 1, total: 152.5 },
    playinSlot: null,
  },

  // --- SWEET 16 ---
  {
    id: 'M_W_S16_1v4',
    round: 's16',
    region: 'W',
    topTeam: { name: 'Duke', seed: 1 },
    botTeam: { name: 'Kansas', seed: 4 },
    prediction: { winner: 'Duke', spreadRaw: 8.8, winIndicator: 1, total: 146.6 },
    playinSlot: null,
  },
  {
    id: 'M_W_S16_3v2',
    round: 's16',
    region: 'W',
    topTeam: { name: 'Michigan St', seed: 3 },
    botTeam: { name: 'Connecticut', seed: 2 },
    prediction: { winner: 'Michigan St', spreadRaw: -2.0, winIndicator: 1, total: 148.9 },
    playinSlot: null,
  },
  {
    id: 'M_X_S16_1v4',
    round: 's16',
    region: 'X',
    topTeam: { name: 'Florida', seed: 1 },
    botTeam: { name: 'Nebraska', seed: 4 },
    prediction: { winner: 'Florida', spreadRaw: 5.1, winIndicator: 1, total: 147.9 },
    playinSlot: null,
  },
  {
    id: 'M_X_S16_3v2',
    round: 's16',
    region: 'X',
    topTeam: { name: 'Illinois', seed: 3 },
    botTeam: { name: 'Houston', seed: 2 },
    prediction: { winner: 'Illinois', spreadRaw: -3.1, winIndicator: 1, total: 156.9 },
    playinSlot: null,
  },
  {
    id: 'M_Y_S16_1v5',
    round: 's16',
    region: 'Y',
    topTeam: { name: 'Michigan', seed: 1 },
    botTeam: { name: 'Texas Tech', seed: 5 },
    prediction: { winner: 'Michigan', spreadRaw: 7.5, winIndicator: 1, total: 149.1 },
    playinSlot: null,
  },
  {
    id: 'M_Y_S16_3v2',
    round: 's16',
    region: 'Y',
    topTeam: { name: 'Virginia', seed: 3 },
    botTeam: { name: 'Iowa St', seed: 2 },
    prediction: { winner: 'Virginia', spreadRaw: 0.4, winIndicator: 1, total: 141.8 },
    playinSlot: null,
  },
  {
    id: 'M_Z_S16_1v4',
    round: 's16',
    region: 'Z',
    topTeam: { name: 'Arizona', seed: 1 },
    botTeam: { name: 'Arkansas', seed: 4 },
    prediction: { winner: 'Arizona', spreadRaw: 5.3, winIndicator: 1, total: 151.2 },
    playinSlot: null,
  },
  {
    id: 'M_Z_S16_3v2',
    round: 's16',
    region: 'Z',
    topTeam: { name: 'Gonzaga', seed: 3 },
    botTeam: { name: 'Purdue', seed: 2 },
    prediction: { winner: 'Purdue', spreadRaw: -1.3, winIndicator: 0, total: 152.7 },
    playinSlot: null,
  },

  // --- ELITE 8 ---
  {
    id: 'M_W_E8',
    round: 'e8',
    region: 'W',
    topTeam: { name: 'Duke', seed: 1 },
    botTeam: { name: 'Michigan St', seed: 3 },
    prediction: { winner: 'Duke', spreadRaw: 7.1, winIndicator: 1, total: 148.5 },
    playinSlot: null,
  },
  {
    id: 'M_X_E8',
    round: 'e8',
    region: 'X',
    topTeam: { name: 'Florida', seed: 1 },
    botTeam: { name: 'Illinois', seed: 3 },
    prediction: { winner: 'Florida', spreadRaw: 6.9, winIndicator: 1, total: 161.7 },
    playinSlot: null,
  },
  {
    id: 'M_Y_E8',
    round: 'e8',
    region: 'Y',
    topTeam: { name: 'Michigan', seed: 1 },
    botTeam: { name: 'Virginia', seed: 3 },
    prediction: { winner: 'Virginia', spreadRaw: 4.7, winIndicator: 0, total: 150.0 },
    playinSlot: null,
  },
  {
    id: 'M_Z_E8',
    round: 'e8',
    region: 'Z',
    topTeam: { name: 'Arizona', seed: 1 },
    botTeam: { name: 'Purdue', seed: 2 },
    prediction: { winner: 'Arizona', spreadRaw: 0.0, winIndicator: 1, total: 150.5 },
    playinSlot: null,
  },

  // --- FINAL FOUR ---
  {
    id: 'M_FF_WX',
    round: 'ff',
    region: null,
    topTeam: { name: 'Duke', seed: 1 },
    botTeam: { name: 'Florida', seed: 1 },
    prediction: { winner: 'Duke', spreadRaw: 2.2, winIndicator: 1, total: 150.7 },
    playinSlot: null,
  },
  {
    id: 'M_FF_YZ',
    round: 'ff',
    region: null,
    topTeam: { name: 'Virginia', seed: 3 },
    botTeam: { name: 'Arizona', seed: 1 },
    prediction: { winner: 'Virginia', spreadRaw: -3.1, winIndicator: 1, total: 148.8 },
    playinSlot: null,
  },

  // --- CHAMPIONSHIP ---
  {
    id: 'M_CHAMP',
    round: 'championship',
    region: null,
    topTeam: { name: 'Duke', seed: 1 },
    botTeam: { name: 'Virginia', seed: 3 },
    prediction: { winner: 'Duke', spreadRaw: 6.5, winIndicator: 1, total: 148.7 },
    playinSlot: null,
  },
];

// ============================================================
// WOMEN'S BRACKET
// ============================================================

export const womensGames = [
  // --- PLAY-IN GAMES ---
  {
    id: 'W_PI_X10',
    round: 'playin',
    region: 'X',
    topTeam: { name: 'Arizona St', seed: 10 },
    botTeam: { name: 'Virginia', seed: 10 },
    prediction: { winner: 'Virginia', spreadRaw: -2.6, winIndicator: 0, total: 131.3 },
    playinSlot: 'X10',
  },
  {
    id: 'W_PI_X16',
    round: 'playin',
    region: 'X',
    topTeam: { name: 'Samford', seed: 16 },
    botTeam: { name: 'Southern Univ', seed: 16 },
    prediction: { winner: 'Southern Univ', spreadRaw: -8.6, winIndicator: 0, total: 112.0 },
    playinSlot: 'X16',
  },
  {
    id: 'W_PI_Y16',
    round: 'playin',
    region: 'Y',
    topTeam: { name: 'Missouri St', seed: 16 },
    botTeam: { name: 'SF Austin', seed: 16 },
    prediction: { winner: 'SF Austin', spreadRaw: -7.5, winIndicator: 0, total: 127.4 },
    playinSlot: 'Y16',
  },
  {
    id: 'W_PI_Z11',
    round: 'playin',
    region: 'Z',
    topTeam: { name: 'Nebraska', seed: 11 },
    botTeam: { name: 'Richmond', seed: 11 },
    prediction: { winner: 'Nebraska', spreadRaw: 5.0, winIndicator: 1, total: 139.4 },
    playinSlot: 'Z11',
  },

  // --- ROUND OF 64 - W REGION ---
  {
    id: 'W_W_R64_1v16',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Connecticut', seed: 1 },
    botTeam: { name: 'UT San Antonio', seed: 16 },
    prediction: { winner: 'Connecticut', spreadRaw: null, winIndicator: 1, total: null },
    playinSlot: null,
  },
  {
    id: 'W_W_R64_8v9',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Iowa St', seed: 8 },
    botTeam: { name: 'Syracuse', seed: 9 },
    prediction: { winner: 'Syracuse', spreadRaw: 2.7, winIndicator: 0, total: 140.9 },
    playinSlot: null,
  },
  {
    id: 'W_W_R64_5v12',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Maryland', seed: 5 },
    botTeam: { name: 'Murray St', seed: 12 },
    prediction: { winner: 'Maryland', spreadRaw: 18.8, winIndicator: 1, total: 147.0 },
    playinSlot: null,
  },
  {
    id: 'W_W_R64_4v13',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'N Carolina', seed: 4 },
    botTeam: { name: 'W Illinois', seed: 13 },
    prediction: { winner: 'N Carolina', spreadRaw: 18.9, winIndicator: 1, total: 145.3 },
    playinSlot: null,
  },
  {
    id: 'W_W_R64_6v11',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Notre Dame', seed: 6 },
    botTeam: { name: 'Fairfield', seed: 11 },
    prediction: { winner: 'Fairfield', spreadRaw: 8.5, winIndicator: 0, total: 131.2 },
    playinSlot: null,
  },
  {
    id: 'W_W_R64_3v14',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Ohio St', seed: 3 },
    botTeam: { name: 'Howard', seed: 14 },
    prediction: { winner: 'Ohio St', spreadRaw: 30.6, winIndicator: 1, total: 139.5 },
    playinSlot: null,
  },
  {
    id: 'W_W_R64_7v10',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Illinois', seed: 7 },
    botTeam: { name: 'Colorado', seed: 10 },
    prediction: { winner: 'Illinois', spreadRaw: 7.3, winIndicator: 1, total: 129.5 },
    playinSlot: null,
  },
  {
    id: 'W_W_R64_2v15',
    round: 'r64',
    region: 'W',
    topTeam: { name: 'Vanderbilt', seed: 2 },
    botTeam: { name: 'High Point', seed: 15 },
    prediction: { winner: 'Vanderbilt', spreadRaw: 25.5, winIndicator: 1, total: 154.7 },
    playinSlot: null,
  },

  // --- ROUND OF 64 - X REGION ---
  {
    id: 'W_X_R64_1v16',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'S Carolina', seed: 1 },
    botTeam: { name: 'S Univ*', seed: 16 },
    prediction: { winner: 'S Carolina', spreadRaw: 45.9, winIndicator: 1, total: 131.6 },
    playinSlot: 'X16',
  },
  {
    id: 'W_X_R64_8v9',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Clemson', seed: 8 },
    botTeam: { name: 'USC', seed: 9 },
    prediction: { winner: 'USC', spreadRaw: -1.2, winIndicator: 0, total: 129.9 },
    playinSlot: null,
  },
  {
    id: 'W_X_R64_5v12',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Michigan St', seed: 5 },
    botTeam: { name: 'Colorado St', seed: 12 },
    prediction: { winner: 'Michigan St', spreadRaw: 16.2, winIndicator: 1, total: 135.1 },
    playinSlot: null,
  },
  {
    id: 'W_X_R64_4v13',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Oklahoma', seed: 4 },
    botTeam: { name: 'Idaho', seed: 13 },
    prediction: { winner: 'Oklahoma', spreadRaw: 26.8, winIndicator: 1, total: 153.3 },
    playinSlot: null,
  },
  {
    id: 'W_X_R64_6v11',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Washington', seed: 6 },
    botTeam: { name: 'S Dakota St', seed: 11 },
    prediction: { winner: 'Washington', spreadRaw: 1.3, winIndicator: 1, total: 136.0 },
    playinSlot: null,
  },
  {
    id: 'W_X_R64_3v14',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'TCU', seed: 3 },
    botTeam: { name: 'UC San Diego', seed: 14 },
    prediction: { winner: 'TCU', spreadRaw: 28.2, winIndicator: 1, total: 139.0 },
    playinSlot: null,
  },
  {
    id: 'W_X_R64_7v10',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Georgia', seed: 7 },
    botTeam: { name: 'Virginia*', seed: 10 },
    prediction: { winner: 'Georgia', spreadRaw: -0.1, winIndicator: 1, total: 134.1 },
    playinSlot: 'X10',
  },
  {
    id: 'W_X_R64_2v15',
    round: 'r64',
    region: 'X',
    topTeam: { name: 'Iowa', seed: 2 },
    botTeam: { name: 'F Dickinson', seed: 15 },
    prediction: { winner: 'Iowa', spreadRaw: 27.5, winIndicator: 1, total: 134.3 },
    playinSlot: null,
  },

  // --- ROUND OF 64 - Y REGION ---
  {
    id: 'W_Y_R64_1v16',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Texas', seed: 1 },
    botTeam: { name: 'SF Austin*', seed: 16 },
    prediction: { winner: 'Texas', spreadRaw: 41.4, winIndicator: 1, total: 149.6 },
    playinSlot: 'Y16',
  },
  {
    id: 'W_Y_R64_8v9',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Oregon', seed: 8 },
    botTeam: { name: 'Virginia Tech', seed: 9 },
    prediction: { winner: 'Oregon', spreadRaw: 2.1, winIndicator: 1, total: 140.7 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R64_5v12',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Kentucky', seed: 5 },
    botTeam: { name: 'James Madison', seed: 12 },
    prediction: { winner: 'Kentucky', spreadRaw: 2.4, winIndicator: 1, total: 138.5 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R64_4v13',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'W Virginia', seed: 4 },
    botTeam: { name: 'Miami OH', seed: 13 },
    prediction: { winner: 'W Virginia', spreadRaw: 23.7, winIndicator: 1, total: 139.1 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R64_6v11',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Alabama', seed: 6 },
    botTeam: { name: 'Rhode Island', seed: 11 },
    prediction: { winner: 'Alabama', spreadRaw: 5.9, winIndicator: 1, total: 122.6 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R64_3v14',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Louisville', seed: 3 },
    botTeam: { name: 'Vermont', seed: 14 },
    prediction: { winner: 'Louisville', spreadRaw: 26.3, winIndicator: 1, total: 132.3 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R64_7v10',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'NC State', seed: 7 },
    botTeam: { name: 'Tennessee', seed: 10 },
    prediction: { winner: 'Tennessee', spreadRaw: 6.2, winIndicator: 0, total: 150.7 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R64_2v15',
    round: 'r64',
    region: 'Y',
    topTeam: { name: 'Michigan', seed: 2 },
    botTeam: { name: 'Holy Cross', seed: 15 },
    prediction: { winner: 'Michigan', spreadRaw: 36.9, winIndicator: 1, total: 134.5 },
    playinSlot: null,
  },

  // --- ROUND OF 64 - Z REGION ---
  {
    id: 'W_Z_R64_1v16',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'UCLA', seed: 1 },
    botTeam: { name: 'Cal Baptist', seed: 16 },
    prediction: { winner: 'UCLA', spreadRaw: 44.0, winIndicator: 1, total: 155.0 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R64_8v9',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Oklahoma St', seed: 8 },
    botTeam: { name: 'Princeton', seed: 9 },
    prediction: { winner: 'Oklahoma St', spreadRaw: 6.4, winIndicator: 1, total: 137.2 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R64_5v12',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Mississippi', seed: 5 },
    botTeam: { name: 'Gonzaga', seed: 12 },
    prediction: { winner: 'Mississippi', spreadRaw: 11.8, winIndicator: 1, total: 139.5 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R64_4v13',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Minnesota', seed: 4 },
    botTeam: { name: 'WI Green Bay', seed: 13 },
    prediction: { winner: 'Minnesota', spreadRaw: 23.8, winIndicator: 1, total: 133.6 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R64_6v11',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Baylor', seed: 6 },
    botTeam: { name: 'Nebraska*', seed: 11 },
    prediction: { winner: 'Baylor', spreadRaw: -0.1, winIndicator: 1, total: 132.7 },
    playinSlot: 'Z11',
  },
  {
    id: 'W_Z_R64_3v14',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Duke', seed: 3 },
    botTeam: { name: 'Col Charleston', seed: 14 },
    prediction: { winner: 'Duke', spreadRaw: 26.7, winIndicator: 1, total: 135.6 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R64_7v10',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'Texas Tech', seed: 7 },
    botTeam: { name: 'Villanova', seed: 10 },
    prediction: { winner: 'Texas Tech', spreadRaw: 6.7, winIndicator: 1, total: 136.7 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R64_2v15',
    round: 'r64',
    region: 'Z',
    topTeam: { name: 'LSU', seed: 2 },
    botTeam: { name: 'Jacksonville', seed: 15 },
    prediction: { winner: 'LSU', spreadRaw: 56.9, winIndicator: 1, total: 153.9 },
    playinSlot: null,
  },

  // --- ROUND OF 32 ---
  {
    id: 'W_W_R32_1v9',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'Connecticut', seed: 1 },
    botTeam: { name: 'Syracuse', seed: 9 },
    prediction: { winner: 'Connecticut', spreadRaw: null, winIndicator: 1, total: null },
    playinSlot: null,
  },
  {
    id: 'W_W_R32_4v5',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'N Carolina', seed: 4 },
    botTeam: { name: 'Maryland', seed: 5 },
    prediction: { winner: 'N Carolina', spreadRaw: -3.4, winIndicator: 1, total: 140.9 },
    playinSlot: null,
  },
  {
    id: 'W_W_R32_3v11',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'Ohio St', seed: 3 },
    botTeam: { name: 'Fairfield', seed: 11 },
    prediction: { winner: 'Fairfield', spreadRaw: 10.5, winIndicator: 0, total: 141.1 },
    playinSlot: null,
  },
  {
    id: 'W_W_R32_2v7',
    round: 'r32',
    region: 'W',
    topTeam: { name: 'Vanderbilt', seed: 2 },
    botTeam: { name: 'Illinois', seed: 7 },
    prediction: { winner: 'Vanderbilt', spreadRaw: 7.4, winIndicator: 1, total: 149.2 },
    playinSlot: null,
  },
  {
    id: 'W_X_R32_1v9',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'S Carolina', seed: 1 },
    botTeam: { name: 'USC', seed: 9 },
    prediction: { winner: 'S Carolina', spreadRaw: 22.8, winIndicator: 1, total: 143.5 },
    playinSlot: null,
  },
  {
    id: 'W_X_R32_4v5',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'Oklahoma', seed: 4 },
    botTeam: { name: 'Michigan St', seed: 5 },
    prediction: { winner: 'Michigan St', spreadRaw: 1.5, winIndicator: 0, total: 151.2 },
    playinSlot: null,
  },
  {
    id: 'W_X_R32_3v6',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'TCU', seed: 3 },
    botTeam: { name: 'Washington', seed: 6 },
    prediction: { winner: 'Washington', spreadRaw: 4.0, winIndicator: 0, total: 142.2 },
    playinSlot: null,
  },
  {
    id: 'W_X_R32_2v7',
    round: 'r32',
    region: 'X',
    topTeam: { name: 'Iowa', seed: 2 },
    botTeam: { name: 'Georgia', seed: 7 },
    prediction: { winner: 'Georgia', spreadRaw: 5.6, winIndicator: 0, total: 137.2 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R32_1v8',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'Texas', seed: 1 },
    botTeam: { name: 'Oregon', seed: 8 },
    prediction: { winner: 'Texas', spreadRaw: 17.2, winIndicator: 1, total: 142.6 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R32_4v5',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'W Virginia', seed: 4 },
    botTeam: { name: 'Kentucky', seed: 5 },
    prediction: { winner: 'W Virginia', spreadRaw: 4.2, winIndicator: 1, total: 131.1 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R32_3v6',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'Louisville', seed: 3 },
    botTeam: { name: 'Alabama', seed: 6 },
    prediction: { winner: 'Louisville', spreadRaw: 8.3, winIndicator: 1, total: 139.9 },
    playinSlot: null,
  },
  {
    id: 'W_Y_R32_2v10',
    round: 'r32',
    region: 'Y',
    topTeam: { name: 'Michigan', seed: 2 },
    botTeam: { name: 'Tennessee', seed: 10 },
    prediction: { winner: 'Michigan', spreadRaw: 17.4, winIndicator: 1, total: 154.7 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R32_1v8',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'UCLA', seed: 1 },
    botTeam: { name: 'Oklahoma St', seed: 8 },
    prediction: { winner: 'UCLA', spreadRaw: 20.0, winIndicator: 1, total: 145.2 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R32_4v5',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'Minnesota', seed: 4 },
    botTeam: { name: 'Mississippi', seed: 5 },
    prediction: { winner: 'Mississippi', spreadRaw: -1.5, winIndicator: 0, total: 133.9 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R32_3v6',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'Duke', seed: 3 },
    botTeam: { name: 'Baylor', seed: 6 },
    prediction: { winner: 'Duke', spreadRaw: 5.7, winIndicator: 1, total: 133.4 },
    playinSlot: null,
  },
  {
    id: 'W_Z_R32_2v7',
    round: 'r32',
    region: 'Z',
    topTeam: { name: 'LSU', seed: 2 },
    botTeam: { name: 'Texas Tech', seed: 7 },
    prediction: { winner: 'LSU', spreadRaw: 26.7, winIndicator: 1, total: 147.0 },
    playinSlot: null,
  },

  // --- SWEET 16 ---
  {
    id: 'W_W_S16_1v4',
    round: 's16',
    region: 'W',
    topTeam: { name: 'Connecticut', seed: 1 },
    botTeam: { name: 'N Carolina', seed: 4 },
    prediction: { winner: 'Connecticut', spreadRaw: null, winIndicator: 1, total: null },
    playinSlot: null,
  },
  {
    id: 'W_W_S16_2v11',
    round: 's16',
    region: 'W',
    topTeam: { name: 'Fairfield', seed: 11 },
    botTeam: { name: 'Vanderbilt', seed: 2 },
    prediction: { winner: 'Vanderbilt', spreadRaw: -9.9, winIndicator: 0, total: 152.5 },
    playinSlot: null,
  },
  {
    id: 'W_X_S16_1v5',
    round: 's16',
    region: 'X',
    topTeam: { name: 'S Carolina', seed: 1 },
    botTeam: { name: 'Michigan St', seed: 5 },
    prediction: { winner: 'S Carolina', spreadRaw: 12.2, winIndicator: 1, total: 144.2 },
    playinSlot: null,
  },
  {
    id: 'W_X_S16_6v7',
    round: 's16',
    region: 'X',
    topTeam: { name: 'Washington', seed: 6 },
    botTeam: { name: 'Georgia', seed: 7 },
    prediction: { winner: 'Washington', spreadRaw: -1.8, winIndicator: 1, total: 130.4 },
    playinSlot: null,
  },
  {
    id: 'W_Y_S16_1v4',
    round: 's16',
    region: 'Y',
    topTeam: { name: 'Texas', seed: 1 },
    botTeam: { name: 'W Virginia', seed: 4 },
    prediction: { winner: 'Texas', spreadRaw: 9.0, winIndicator: 1, total: 141.7 },
    playinSlot: null,
  },
  {
    id: 'W_Y_S16_3v2',
    round: 's16',
    region: 'Y',
    topTeam: { name: 'Louisville', seed: 3 },
    botTeam: { name: 'Michigan', seed: 2 },
    prediction: { winner: 'Michigan', spreadRaw: -3.0, winIndicator: 0, total: 154.5 },
    playinSlot: null,
  },
  {
    id: 'W_Z_S16_1v5',
    round: 's16',
    region: 'Z',
    topTeam: { name: 'UCLA', seed: 1 },
    botTeam: { name: 'Mississippi', seed: 5 },
    prediction: { winner: 'UCLA', spreadRaw: 9.4, winIndicator: 1, total: 140.5 },
    playinSlot: null,
  },
  {
    id: 'W_Z_S16_3v2',
    round: 's16',
    region: 'Z',
    topTeam: { name: 'Duke', seed: 3 },
    botTeam: { name: 'LSU', seed: 2 },
    prediction: { winner: 'LSU', spreadRaw: -9.8, winIndicator: 0, total: 150.2 },
    playinSlot: null,
  },

  // --- ELITE 8 ---
  {
    id: 'W_W_E8',
    round: 'e8',
    region: 'W',
    topTeam: { name: 'Connecticut', seed: 1 },
    botTeam: { name: 'Vanderbilt', seed: 2 },
    prediction: { winner: 'Connecticut', spreadRaw: null, winIndicator: 1, total: null },
    playinSlot: null,
  },
  {
    id: 'W_X_E8',
    round: 'e8',
    region: 'X',
    topTeam: { name: 'S Carolina', seed: 1 },
    botTeam: { name: 'Washington', seed: 6 },
    prediction: { winner: 'S Carolina', spreadRaw: 17.2, winIndicator: 1, total: 140.4 },
    playinSlot: null,
  },
  {
    id: 'W_Y_E8',
    round: 'e8',
    region: 'Y',
    topTeam: { name: 'Texas', seed: 1 },
    botTeam: { name: 'Michigan', seed: 2 },
    prediction: { winner: 'Texas', spreadRaw: 7.7, winIndicator: 1, total: 153.1 },
    playinSlot: null,
  },
  {
    id: 'W_Z_E8',
    round: 'e8',
    region: 'Z',
    topTeam: { name: 'UCLA', seed: 1 },
    botTeam: { name: 'LSU', seed: 2 },
    prediction: { winner: 'UCLA', spreadRaw: -1.3, winIndicator: 1, total: 154.7 },
    playinSlot: null,
  },

  // --- FINAL FOUR ---
  {
    id: 'W_FF_WX',
    round: 'ff',
    region: null,
    topTeam: { name: 'Connecticut', seed: 1 },
    botTeam: { name: 'S Carolina', seed: 1 },
    prediction: { winner: 'Connecticut', spreadRaw: null, winIndicator: 1, total: null },
    playinSlot: null,
  },
  {
    id: 'W_FF_YZ',
    round: 'ff',
    region: null,
    topTeam: { name: 'Texas', seed: 1 },
    botTeam: { name: 'UCLA', seed: 1 },
    prediction: { winner: 'Texas', spreadRaw: 2.0, winIndicator: 1, total: 148.0 },
    playinSlot: null,
  },

  // --- CHAMPIONSHIP ---
  {
    id: 'W_CHAMP',
    round: 'championship',
    region: null,
    topTeam: { name: 'Connecticut', seed: 1 },
    botTeam: { name: 'Texas', seed: 1 },
    prediction: { winner: 'Connecticut', spreadRaw: null, winIndicator: 1, total: null },
    playinSlot: null,
  },
];

// ============================================================
// Helper functions
// ============================================================

export function getGamesByRound(games, round) {
  return games.filter((g) => g.round === round);
}

export function getGamesByRegion(games, region) {
  return games.filter((g) => g.region === region);
}

export function getConfidence(game) {
  if (!game.prediction || game.prediction.spreadRaw === null) return 'unknown';
  const abs = Math.abs(game.prediction.spreadRaw);
  if (abs >= 10) return 'high';
  if (abs >= 5) return 'medium';
  return 'low';
}

export function getPredictedMargin(game) {
  if (!game.prediction || game.prediction.spreadRaw === null) return null;
  return Math.abs(game.prediction.spreadRaw);
}

// ============================================================
// Feed mappings for progressive bracket
// ============================================================

function _buildFeedsInto() {
  const map = {};
  function mf(from, to, slot) { map[from] = { nextGameId: to, slot }; }

  // Men's W region
  mf('M_W_R64_1v16','M_W_R32_1v9','top'); mf('M_W_R64_8v9','M_W_R32_1v9','bot');
  mf('M_W_R64_4v13','M_W_R32_4v5','top'); mf('M_W_R64_5v12','M_W_R32_4v5','bot');
  mf('M_W_R64_3v14','M_W_R32_3v6','top'); mf('M_W_R64_6v11','M_W_R32_3v6','bot');
  mf('M_W_R64_2v15','M_W_R32_2v7','top'); mf('M_W_R64_7v10','M_W_R32_2v7','bot');
  mf('M_W_R32_1v9','M_W_S16_1v4','top');  mf('M_W_R32_4v5','M_W_S16_1v4','bot');
  mf('M_W_R32_3v6','M_W_S16_3v2','top');  mf('M_W_R32_2v7','M_W_S16_3v2','bot');
  mf('M_W_S16_1v4','M_W_E8','top');        mf('M_W_S16_3v2','M_W_E8','bot');
  mf('M_W_E8','M_FF_WX','top');

  // Men's X region
  mf('M_X_R64_1v16','M_X_R32_1v8','top'); mf('M_X_R64_8v9','M_X_R32_1v8','bot');
  mf('M_X_R64_4v13','M_X_R32_4v5','top'); mf('M_X_R64_5v12','M_X_R32_4v5','bot');
  mf('M_X_R64_3v14','M_X_R32_3v6','top'); mf('M_X_R64_6v11','M_X_R32_3v6','bot');
  mf('M_X_R64_2v15','M_X_R32_2v7','top'); mf('M_X_R64_7v10','M_X_R32_2v7','bot');
  mf('M_X_R32_1v8','M_X_S16_1v4','top');  mf('M_X_R32_4v5','M_X_S16_1v4','bot');
  mf('M_X_R32_3v6','M_X_S16_3v2','top');  mf('M_X_R32_2v7','M_X_S16_3v2','bot');
  mf('M_X_S16_1v4','M_X_E8','top');        mf('M_X_S16_3v2','M_X_E8','bot');
  mf('M_X_E8','M_FF_WX','bot');

  // Men's Y region
  mf('M_Y_R64_1v16','M_Y_R32_1v8','top'); mf('M_Y_R64_8v9','M_Y_R32_1v8','bot');
  mf('M_Y_R64_4v13','M_Y_R32_4v5','top'); mf('M_Y_R64_5v12','M_Y_R32_4v5','bot');
  mf('M_Y_R64_3v14','M_Y_R32_3v6','top'); mf('M_Y_R64_6v11','M_Y_R32_3v6','bot');
  mf('M_Y_R64_2v15','M_Y_R32_2v7','top'); mf('M_Y_R64_7v10','M_Y_R32_2v7','bot');
  mf('M_Y_R32_1v8','M_Y_S16_1v5','top');  mf('M_Y_R32_4v5','M_Y_S16_1v5','bot');
  mf('M_Y_R32_3v6','M_Y_S16_3v2','top');  mf('M_Y_R32_2v7','M_Y_S16_3v2','bot');
  mf('M_Y_S16_1v5','M_Y_E8','top');        mf('M_Y_S16_3v2','M_Y_E8','bot');
  mf('M_Y_E8','M_FF_YZ','top');

  // Men's Z region
  mf('M_Z_R64_1v16','M_Z_R32_1v8','top'); mf('M_Z_R64_8v9','M_Z_R32_1v8','bot');
  mf('M_Z_R64_4v13','M_Z_R32_4v5','top'); mf('M_Z_R64_5v12','M_Z_R32_4v5','bot');
  mf('M_Z_R64_3v14','M_Z_R32_3v6','top'); mf('M_Z_R64_6v11','M_Z_R32_3v6','bot');
  mf('M_Z_R64_2v15','M_Z_R32_2v7','top'); mf('M_Z_R64_7v10','M_Z_R32_2v7','bot');
  mf('M_Z_R32_1v8','M_Z_S16_1v4','top');  mf('M_Z_R32_4v5','M_Z_S16_1v4','bot');
  mf('M_Z_R32_3v6','M_Z_S16_3v2','top');  mf('M_Z_R32_2v7','M_Z_S16_3v2','bot');
  mf('M_Z_S16_1v4','M_Z_E8','top');        mf('M_Z_S16_3v2','M_Z_E8','bot');
  mf('M_Z_E8','M_FF_YZ','bot');

  // Men's FF -> Championship
  mf('M_FF_WX','M_CHAMP','top'); mf('M_FF_YZ','M_CHAMP','bot');

  // Women's W region
  mf('W_W_R64_1v16','W_W_R32_1v9','top'); mf('W_W_R64_8v9','W_W_R32_1v9','bot');
  mf('W_W_R64_4v13','W_W_R32_4v5','top'); mf('W_W_R64_5v12','W_W_R32_4v5','bot');
  mf('W_W_R64_3v14','W_W_R32_3v11','top'); mf('W_W_R64_6v11','W_W_R32_3v11','bot');
  mf('W_W_R64_2v15','W_W_R32_2v7','top'); mf('W_W_R64_7v10','W_W_R32_2v7','bot');
  mf('W_W_R32_1v9','W_W_S16_1v4','top');  mf('W_W_R32_4v5','W_W_S16_1v4','bot');
  mf('W_W_R32_3v11','W_W_S16_2v11','top'); mf('W_W_R32_2v7','W_W_S16_2v11','bot');
  mf('W_W_S16_1v4','W_W_E8','top');        mf('W_W_S16_2v11','W_W_E8','bot');
  mf('W_W_E8','W_FF_WX','top');

  // Women's X region
  mf('W_X_R64_1v16','W_X_R32_1v9','top'); mf('W_X_R64_8v9','W_X_R32_1v9','bot');
  mf('W_X_R64_4v13','W_X_R32_4v5','top'); mf('W_X_R64_5v12','W_X_R32_4v5','bot');
  mf('W_X_R64_3v14','W_X_R32_3v6','top'); mf('W_X_R64_6v11','W_X_R32_3v6','bot');
  mf('W_X_R64_2v15','W_X_R32_2v7','top'); mf('W_X_R64_7v10','W_X_R32_2v7','bot');
  mf('W_X_R32_1v9','W_X_S16_1v5','top');  mf('W_X_R32_4v5','W_X_S16_1v5','bot');
  mf('W_X_R32_3v6','W_X_S16_6v7','top');  mf('W_X_R32_2v7','W_X_S16_6v7','bot');
  mf('W_X_S16_1v5','W_X_E8','top');        mf('W_X_S16_6v7','W_X_E8','bot');
  mf('W_X_E8','W_FF_WX','bot');

  // Women's Y region
  mf('W_Y_R64_1v16','W_Y_R32_1v8','top'); mf('W_Y_R64_8v9','W_Y_R32_1v8','bot');
  mf('W_Y_R64_4v13','W_Y_R32_4v5','top'); mf('W_Y_R64_5v12','W_Y_R32_4v5','bot');
  mf('W_Y_R64_3v14','W_Y_R32_3v6','top'); mf('W_Y_R64_6v11','W_Y_R32_3v6','bot');
  mf('W_Y_R64_2v15','W_Y_R32_2v10','top'); mf('W_Y_R64_7v10','W_Y_R32_2v10','bot');
  mf('W_Y_R32_1v8','W_Y_S16_1v4','top');  mf('W_Y_R32_4v5','W_Y_S16_1v4','bot');
  mf('W_Y_R32_3v6','W_Y_S16_3v2','top');  mf('W_Y_R32_2v10','W_Y_S16_3v2','bot');
  mf('W_Y_S16_1v4','W_Y_E8','top');        mf('W_Y_S16_3v2','W_Y_E8','bot');
  mf('W_Y_E8','W_FF_YZ','top');

  // Women's Z region
  mf('W_Z_R64_1v16','W_Z_R32_1v8','top'); mf('W_Z_R64_8v9','W_Z_R32_1v8','bot');
  mf('W_Z_R64_4v13','W_Z_R32_4v5','top'); mf('W_Z_R64_5v12','W_Z_R32_4v5','bot');
  mf('W_Z_R64_3v14','W_Z_R32_3v6','top'); mf('W_Z_R64_6v11','W_Z_R32_3v6','bot');
  mf('W_Z_R64_2v15','W_Z_R32_2v7','top'); mf('W_Z_R64_7v10','W_Z_R32_2v7','bot');
  mf('W_Z_R32_1v8','W_Z_S16_1v5','top');  mf('W_Z_R32_4v5','W_Z_S16_1v5','bot');
  mf('W_Z_R32_3v6','W_Z_S16_3v2','top');  mf('W_Z_R32_2v7','W_Z_S16_3v2','bot');
  mf('W_Z_S16_1v5','W_Z_E8','top');        mf('W_Z_S16_3v2','W_Z_E8','bot');
  mf('W_Z_E8','W_FF_YZ','bot');

  // Women's FF -> Championship
  mf('W_FF_WX','W_CHAMP','top'); mf('W_FF_YZ','W_CHAMP','bot');

  return map;
}

export const FEEDS_INTO = _buildFeedsInto();

export const FEEDS_FROM = (() => {
  const map = {};
  Object.entries(FEEDS_INTO).forEach(([from, { nextGameId, slot }]) => {
    if (!map[nextGameId]) map[nextGameId] = {};
    map[nextGameId][slot] = from;
  });
  return map;
})();
