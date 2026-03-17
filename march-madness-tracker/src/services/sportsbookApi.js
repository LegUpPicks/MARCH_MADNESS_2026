const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball';

// ── Name normalisation ─────────────────────────────────────────
// Maps lowercase ESPN full team name → bracket short name
const ESPN_TO_BRACKET = {
  'uconn huskies':                     'Connecticut',
  'connecticut huskies':               'Connecticut',
  'north carolina tar heels':          'N Carolina',
  'northern iowa panthers':            'N Iowa',
  "saint mary's gaels":                "St Mary's CA",
  "saint mary's (ca) gaels":           "St Mary's CA",
  'saint louis billikens':             'St Louis',
  'south florida bulls':               'S Florida',
  'north dakota state bison':          'N Dakota St',
  'mcneese cowboys':                   'McNeese St',
  'mcneese state cowboys':             'McNeese St',
  'kennesaw state owls':               'Kennesaw',
  'california baptist lancers':        'Cal Baptist',
  'prairie view a&m panthers':         'Prairie View',
  "queens university royals":          'Queens NC',
  "queens university of charlotte royals": 'Queens NC',
  "queens university of charlotte":    'Queens NC',
  'miami (oh) redhawks':               'Miami OH',
  'miami redhawks':                    'Miami OH',
  'miami hurricanes':                  'Miami FL',
  'southern methodist mustangs':       'SMU',
  'smu mustangs':                      'SMU',
  'wright state raiders':              'Wright St',
  'utah state aggies':                 'Utah St',
  'stephen f. austin lumberjacks':     'SF Austin',
  'north carolina state wolfpack':     'NC State',
  'nc state wolfpack':                 'NC State',
  'pennsylvania quakers':              'Penn',
  'tennessee state tigers':            'Tennessee St',
  'south carolina gamecocks':          'S Carolina',
  'west virginia mountaineers':        'W Virginia',
  'southern illinois salukis':         'S Illinois',
  'south dakota state jackrabbits':    'S Dakota St',
  'uc san diego tritons':              'UC San Diego',
  'oklahoma state cowboys':            'Oklahoma St',
  'murray state racers':               'Murray St',
  'western illinois leathernecks':     'W Illinois',
  'college of charleston cougars':     'Col Charleston',
  'liu brooklyn blackbirds':           'LIU Brooklyn',
  'long island university sharks':     'LIU Brooklyn',
  'green bay phoenix':                 'WI Green Bay',
  'wisconsin-green bay phoenix':       'WI Green Bay',
  "st. john's red storm":              "St John's",
  "st john's red storm":               "St John's",
  'samford bulldogs':                  'Samford',
  'high point panthers':               'High Point',
  'jacksonville dolphins':             'Jacksonville',
  'holy cross crusaders':              'Holy Cross',
  'james madison dukes':               'James Madison',
  'rhode island rams':                 'Rhode Island',
  'fairfield stags':                   'Fairfield',
  'southern university jaguars':       'Southern Univ',
  'umbc retrievers':                   'UMBC',
  'lehigh mountain hawks':             'Lehigh',
};

function normaliseEspnName(name) {
  const lo = name.toLowerCase().trim();
  return ESPN_TO_BRACKET[lo] ?? name;
}

// Strips punctuation/asterisks for loose comparison
function nameForCompare(s) {
  return s.toLowerCase().replace(/[.'*]/g, '').replace(/\s+/g, ' ').trim();
}

// Does an ESPN team display name match a bracket short name?
function teamMatches(espnName, bracketName) {
  const clean = bracketName.replace(/\*$/, '');
  const norm  = normaliseEspnName(espnName);
  if (norm === clean) return true;
  const espnCmp    = nameForCompare(espnName);
  const bracketCmp = nameForCompare(clean);
  return espnCmp.includes(bracketCmp) || bracketCmp.includes(espnCmp);
}

// ── Fetch all events for one date (YYYYMMDD) ───────────────────
async function fetchEspnGamesForDate(dateStr) {
  const url = `${ESPN_BASE}/scoreboard?dates=${dateStr}&groups=50`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

// ── Parse ESPN event → { dk: { moneyline, spread, total } } ───
// moneyline: { [teamName]: odds_string }
// spread:    { [teamName]: { line: string, odds: string } }
// total:     { line: number, overOdds: string, underOdds: string }
function parseEspnEvent(event, homeTeamName, awayTeamName) {
  const result = { dk: { moneyline: {}, spread: {}, total: null } };

  const odds = event.competitions?.[0]?.odds?.[0];
  if (!odds) return result;

  // Moneyline
  const homeML = odds.moneyline?.home?.close?.odds ?? null;
  const awayML = odds.moneyline?.away?.close?.odds ?? null;
  if (homeML != null) result.dk.moneyline[homeTeamName] = homeML;
  if (awayML != null) result.dk.moneyline[awayTeamName] = awayML;

  // Spread — both teams' line + odds from odds.pointSpread
  const homeSpreadLine = odds.pointSpread?.home?.close?.line ?? null;
  const homeSpreadOdds = odds.pointSpread?.home?.close?.odds ?? null;
  const awaySpreadLine = odds.pointSpread?.away?.close?.line ?? null;
  const awaySpreadOdds = odds.pointSpread?.away?.close?.odds ?? null;
  if (homeSpreadLine != null) result.dk.spread[homeTeamName] = { line: homeSpreadLine, odds: homeSpreadOdds };
  if (awaySpreadLine != null) result.dk.spread[awayTeamName] = { line: awaySpreadLine, odds: awaySpreadOdds };

  // Total
  if (odds.overUnder != null) {
    result.dk.total = {
      line:      odds.overUnder,
      overOdds:  odds.total?.over?.close?.odds ?? null,
      underOdds: odds.total?.under?.close?.odds ?? null,
    };
  }

  return result;
}

// ── Main: fetch odds for a set of bracket games ────────────────
// Fetches today + next 6 days in parallel to cover the current round
// Returns: { [gameId]: { dk: { moneyline, spread, total } } }
export async function fetchOddsForGames(bracketGames) {
  // Build date strings for today + next 6 days
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  });

  const allEventArrays = await Promise.all(dates.map(fetchEspnGamesForDate));
  const allEvents = allEventArrays.flat();
  console.log('[sportsbookApi] ESPN events found across 7 days:', allEvents.length);

  const relevantGames = bracketGames.filter(
    g => ['playin', 'r64', 'r32', 's16', 'e8', 'ff', 'championship'].includes(g.round)
  );

  const oddsMap = {};

  for (const event of allEvents) {
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitors = competition.competitors ?? [];
    const homeComp = competitors.find(c => c.homeAway === 'home');
    const awayComp = competitors.find(c => c.homeAway === 'away');
    if (!homeComp || !awayComp) continue;

    const homeApiName = homeComp.team.displayName;
    const awayApiName = awayComp.team.displayName;

    for (const bracketGame of relevantGames) {
      if (oddsMap[bracketGame.id]) continue;

      const top = bracketGame.topTeam?.name;
      const bot = bracketGame.botTeam?.name;
      if (!top || !bot) continue;

      let homeTeamBracket = null, awayTeamBracket = null;

      if (teamMatches(homeApiName, top) && teamMatches(awayApiName, bot)) {
        homeTeamBracket = top.replace(/\*$/, '');
        awayTeamBracket = bot.replace(/\*$/, '');
      } else if (teamMatches(homeApiName, bot) && teamMatches(awayApiName, top)) {
        homeTeamBracket = bot.replace(/\*$/, '');
        awayTeamBracket = top.replace(/\*$/, '');
      }

      if (homeTeamBracket && awayTeamBracket) {
        const result = parseEspnEvent(event, homeTeamBracket, awayTeamBracket);

        // Check if game is final and record the actual winner
        const isCompleted = competition.status?.type?.completed === true;
        if (isCompleted) {
          const winnerComp = competitors.find(c => c.winner === true);
          if (winnerComp) {
            result.completedWinner = winnerComp.team.displayName === homeApiName
              ? homeTeamBracket
              : awayTeamBracket;
          }
        }

        oddsMap[bracketGame.id] = result;
        console.log(
          `[sportsbookApi] matched: "${top}" vs "${bot}"`,
          isCompleted ? `→ FINAL winner: ${result.completedWinner}` : ''
        );
        break;
      }
    }
  }

  // Log unmatched bracket games for debugging
  const unmatched = relevantGames.filter(g => !oddsMap[g.id] && g.topTeam?.name && g.botTeam?.name);
  if (unmatched.length) {
    console.warn('[sportsbookApi] unmatched bracket games:', unmatched.map(g => `${g.topTeam.name} vs ${g.botTeam.name}`));
  }
  console.log('[sportsbookApi] ESPN odds built for', Object.keys(oddsMap).length, '/', relevantGames.length, 'bracket games');
  return oddsMap;
}
