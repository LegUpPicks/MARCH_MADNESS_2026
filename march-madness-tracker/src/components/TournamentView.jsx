import { mensGames, womensGames } from '../data/bracketData';
import { useSelections } from '../hooks/useSelections';
import BracketView from './BracketView';
import SidePanel from './SidePanel';

export default function TournamentView({ gender }) {
  const games = gender === 'mens' ? mensGames : womensGames;
  const [selections, setWinner, clearSelections] = useSelections(gender);

  return (
    <div className="tournament-view">
      <div className="bracket-container">
        <BracketView
          games={games}
          selections={selections}
          onSelect={setWinner}
        />
      </div>
      <div className="side-panel-container">
        <SidePanel
          games={games}
          selections={selections}
          onClear={clearSelections}
        />
      </div>
    </div>
  );
}
