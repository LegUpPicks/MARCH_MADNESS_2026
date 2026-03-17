import GameCard from './GameCard';
import { getGamesByRound, getGamesByRegion } from '../data/bracketData';
import { ROUND_LABELS } from '../hooks/useBracketState';

const REGION_LABELS = {
  W: 'East', X: 'South', Y: 'Midwest', Z: 'West',
};

const R64_ORDER = ['1v16','8v9','5v12','4v13','6v11','3v14','7v10','2v15'];
const R32_ORDER = ['1v','4v','3v','2v'];
const S16_ORDER = ['1v','3v','2v','6v'];

function sortByOrder(games, round) {
  if (round === 'r64') {
    return [...games].sort((a,b) => {
      const ai = R64_ORDER.findIndex(o => a.id.includes(o));
      const bi = R64_ORDER.findIndex(o => b.id.includes(o));
      return ai - bi;
    });
  }
  if (round === 'r32') {
    return [...games].sort((a,b) => {
      const ak = a.id.split('_').pop();
      const bk = b.id.split('_').pop();
      return R32_ORDER.findIndex(o => ak.startsWith(o)) - R32_ORDER.findIndex(o => bk.startsWith(o));
    });
  }
  if (round === 's16') {
    return [...games].sort((a,b) => {
      const ak = a.id.split('_').pop();
      const bk = b.id.split('_').pop();
      return S16_ORDER.findIndex(o => ak.startsWith(o)) - S16_ORDER.findIndex(o => bk.startsWith(o));
    });
  }
  return games;
}

function RegionBracket({ region, games, selections, predictedRounds, resolveTeams, onSelect }) {
  const rounds = ['r64','r32','s16','e8'];
  const roundGames = {};
  rounds.forEach((r) => {
    roundGames[r] = sortByOrder(getGamesByRound(getGamesByRegion(games, region), r), r);
  });

  function renderCard(game) {
    const { topTeam, botTeam } = resolveTeams(game);
    const prediction = predictedRounds.has(game.round) ? game.prediction : null;
    return (
      <GameCard
        key={game.id}
        game={game}
        topTeam={topTeam}
        botTeam={botTeam}
        prediction={prediction}
        selection={selections[game.id] || null}
        onSelect={(name) => onSelect(game.id, name)}
      />
    );
  }

  return (
    <div className="region-bracket">
      <div className="region-label">{REGION_LABELS[region] || region}</div>
      <div className="bracket-rounds">
        {rounds.map((round) => (
          <div key={round} className="bracket-round-col">
            <div className="round-label">{round.toUpperCase()}</div>
            <div className="round-games">
              {roundGames[round].map((game) => renderCard(game))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BracketView({
  games, selections, predictedRounds, resolveTeams,
  nextPredictableRound, predictRound, onSelect,
}) {
  const playinGames = getGamesByRound(games, 'playin');
  const ffGames = getGamesByRound(games, 'ff');
  const champGames = getGamesByRound(games, 'championship');
  const ffWX = ffGames.filter((g) => g.id.includes('FF_WX'));
  const ffYZ = ffGames.filter((g) => g.id.includes('FF_YZ'));

  function renderCard(game) {
    const { topTeam, botTeam } = resolveTeams(game);
    const prediction = predictedRounds.has(game.round) ? game.prediction : null;
    return (
      <GameCard
        key={game.id}
        game={game}
        topTeam={topTeam}
        botTeam={botTeam}
        prediction={prediction}
        selection={selections[game.id] || null}
        onSelect={(name) => onSelect(game.id, name)}
      />
    );
  }

  return (
    <div className="bracket-view">
      {/* Predict Banner */}
      {nextPredictableRound && (
        <div className="predict-banner">
          <span className="predict-banner-text">
            All {ROUND_LABELS[nextPredictableRound]} matchups are set —
          </span>
          <button
            className="predict-btn"
            onClick={() => predictRound(nextPredictableRound)}
          >
            Reveal {ROUND_LABELS[nextPredictableRound]} Predictions
          </button>
        </div>
      )}

      {/* Play-in */}
      {playinGames.length > 0 && (
        <div className="playin-section">
          <div className="playin-header">Play-In Games</div>
          <div className="playin-games">
            {playinGames.map((game) => (
              <div key={game.id} className="playin-item">
                <div className="playin-slot-label">
                  → {REGION_LABELS[game.region]} #{game.playinSlot?.replace(game.region, '')}
                </div>
                {renderCard(game)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main bracket */}
      <div className="main-bracket">
        <div className="bracket-side bracket-left">
          <RegionBracket region="W" games={games} selections={selections} predictedRounds={predictedRounds} resolveTeams={resolveTeams} onSelect={onSelect} />
          <RegionBracket region="X" games={games} selections={selections} predictedRounds={predictedRounds} resolveTeams={resolveTeams} onSelect={onSelect} />
        </div>

        <div className="bracket-center">
          <div className="center-label">Final Four &amp; Championship</div>
          <div className="ff-section">
            <div className="ff-col">
              <div className="ff-round-label">Semi East/South</div>
              {ffWX.map((g) => renderCard(g))}
            </div>
            <div className="champ-col">
              <div className="ff-round-label">Championship</div>
              {champGames.map((g) => renderCard(g))}
            </div>
            <div className="ff-col">
              <div className="ff-round-label">Semi Midwest/West</div>
              {ffYZ.map((g) => renderCard(g))}
            </div>
          </div>
        </div>

        <div className="bracket-side bracket-right">
          <RegionBracket region="Y" games={games} selections={selections} predictedRounds={predictedRounds} resolveTeams={resolveTeams} onSelect={onSelect} />
          <RegionBracket region="Z" games={games} selections={selections} predictedRounds={predictedRounds} resolveTeams={resolveTeams} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
