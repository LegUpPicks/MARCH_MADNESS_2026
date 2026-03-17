import GameCard from './GameCard';
import { getGamesByRound, getGamesByRegion } from '../data/bracketData';

const ROUND_LABELS = {
  r64: 'R64',
  r32: 'R32',
  s16: 'S16',
  e8: 'E8',
  ff: 'FF',
  championship: 'Champ',
};

const REGION_LABELS = {
  W: 'West',
  X: 'East',
  Y: 'South',
  Z: 'Midwest',
};

// Order of games within a region for each round (by seed matchup position)
// We want them displayed top-to-bottom in bracket order: 1/16, 8/9, 5/12, 4/13, 6/11, 3/14, 7/10, 2/15
const R64_ORDER = ['1v16', '8v9', '5v12', '4v13', '6v11', '3v14', '7v10', '2v15'];
const R32_ORDER = ['1v', '4v', '3v', '2v'];
const S16_ORDER = ['1v', '3v', '2v', '6v'];

function sortByBracketOrder(games, round) {
  if (round === 'r64') {
    return games.slice().sort((a, b) => {
      const aMatch = R64_ORDER.findIndex((o) => a.id.includes(o));
      const bMatch = R64_ORDER.findIndex((o) => b.id.includes(o));
      return aMatch - bMatch;
    });
  }
  if (round === 'r32') {
    return games.slice().sort((a, b) => {
      // Extract seed portion after region prefix e.g. M_W_R32_1v9 -> "1v"
      const aKey = a.id.split('_').pop(); // e.g. "1v9"
      const bKey = b.id.split('_').pop();
      const aMatch = R32_ORDER.findIndex((o) => aKey.startsWith(o));
      const bMatch = R32_ORDER.findIndex((o) => bKey.startsWith(o));
      return aMatch - bMatch;
    });
  }
  if (round === 's16') {
    return games.slice().sort((a, b) => {
      const aKey = a.id.split('_').pop();
      const bKey = b.id.split('_').pop();
      const aMatch = S16_ORDER.findIndex((o) => aKey.startsWith(o));
      const bMatch = S16_ORDER.findIndex((o) => bKey.startsWith(o));
      return aMatch - bMatch;
    });
  }
  return games;
}

// A single region column showing all rounds
function RegionBracket({ region, games, selections, onSelect, isRight }) {
  const rounds = ['r64', 'r32', 's16', 'e8'];

  const roundGames = {};
  rounds.forEach((r) => {
    const rg = getGamesByRound(getGamesByRegion(games, region), r);
    roundGames[r] = sortByBracketOrder(rg, r);
  });

  return (
    <div className={`region-bracket ${isRight ? 'region-right' : 'region-left'}`}>
      <div className="region-label">{REGION_LABELS[region] || region}</div>
      <div className="bracket-rounds">
        {rounds.map((round) => (
          <div key={round} className="bracket-round-col">
            <div className="round-label">{ROUND_LABELS[round]}</div>
            <div className="round-games">
              {roundGames[round].map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  selection={selections[game.id] || null}
                  onSelect={(teamName) => onSelect(game.id, teamName)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BracketView({ games, selections, onSelect }) {
  const playinGames = getGamesByRound(games, 'playin');
  const ffGames = getGamesByRound(games, 'ff');
  const champGames = getGamesByRound(games, 'championship');

  // Separate FF games by which side they belong to
  // WX = left side (W and X regions), YZ = right side (Y and Z regions)
  const ffWX = ffGames.filter((g) => g.id.includes('WX') || g.id.includes('FF_WX'));
  const ffYZ = ffGames.filter((g) => g.id.includes('YZ') || g.id.includes('FF_YZ'));

  return (
    <div className="bracket-view">
      {/* Play-in section */}
      {playinGames.length > 0 && (
        <div className="playin-section">
          <div className="playin-header">Play-In Games</div>
          <div className="playin-games">
            {playinGames.map((game) => (
              <div key={game.id} className="playin-item">
                <div className="playin-slot-label">→ {game.region}{game.playinSlot?.replace(game.region, '')}</div>
                <GameCard
                  game={game}
                  selection={selections[game.id] || null}
                  onSelect={(teamName) => onSelect(game.id, teamName)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main bracket */}
      <div className="main-bracket">
        {/* Left side: W and Y regions */}
        <div className="bracket-side bracket-left">
          <RegionBracket
            region="W"
            games={games}
            selections={selections}
            onSelect={onSelect}
            isRight={false}
          />
          <RegionBracket
            region="Y"
            games={games}
            selections={selections}
            onSelect={onSelect}
            isRight={false}
          />
        </div>

        {/* Center: Final Four + Championship */}
        <div className="bracket-center">
          <div className="center-label">Final Four &amp; Championship</div>
          <div className="ff-section">
            {/* FF game for W/X */}
            <div className="ff-col">
              <div className="ff-round-label">Semi W/X</div>
              {ffWX.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  selection={selections[game.id] || null}
                  onSelect={(teamName) => onSelect(game.id, teamName)}
                />
              ))}
            </div>

            {/* Championship */}
            <div className="champ-col">
              <div className="ff-round-label">Championship</div>
              {champGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  selection={selections[game.id] || null}
                  onSelect={(teamName) => onSelect(game.id, teamName)}
                />
              ))}
            </div>

            {/* FF game for Y/Z */}
            <div className="ff-col">
              <div className="ff-round-label">Semi Y/Z</div>
              {ffYZ.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  selection={selections[game.id] || null}
                  onSelect={(teamName) => onSelect(game.id, teamName)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right side: X and Z regions */}
        <div className="bracket-side bracket-right">
          <RegionBracket
            region="X"
            games={games}
            selections={selections}
            onSelect={onSelect}
            isRight={true}
          />
          <RegionBracket
            region="Z"
            games={games}
            selections={selections}
            onSelect={onSelect}
            isRight={true}
          />
        </div>
      </div>
    </div>
  );
}
