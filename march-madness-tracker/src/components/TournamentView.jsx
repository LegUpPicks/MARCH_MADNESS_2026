import { useBracketState } from '../hooks/useBracketState';
import BracketView from './BracketView';
import SidePanel from './SidePanel';
import PredictionsTable from './PredictionsTable';

export default function TournamentView({ gender }) {
  const state = useBracketState(gender);

  return (
    <div className="tournament-view">
      <div className="bracket-container">
        <BracketView
          games={state.games}
          selections={state.selections}
          predictedRounds={state.predictedRounds}
          resolveTeams={state.resolveTeams}
          nextPredictableRound={state.nextPredictableRound}
          predictRound={state.predictRound}
          onSelect={state.setWinner}
        />
        <PredictionsTable
          games={state.games}
          predictedRounds={state.predictedRounds}
          resolveTeams={state.resolveTeams}
        />
      </div>
      <div className="side-panel-container">
        <SidePanel
          games={state.games}
          selections={state.selections}
          predictedRounds={state.predictedRounds}
          resolveTeams={state.resolveTeams}
          onClear={state.clearAll}
        />
      </div>
    </div>
  );
}
