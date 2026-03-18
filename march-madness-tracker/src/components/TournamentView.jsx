import { useEffect } from 'react';
import { useBracketState } from '../hooks/useBracketState';
import { useSportsbookOdds } from '../hooks/useSportsbookOdds';
import BracketView from './BracketView';
import PredictionsTable from './PredictionsTable';
import ModelSummary from './ModelSummary';

export default function TournamentView({ gender }) {
  const state = useBracketState(gender);
  const { oddsMap, loading: oddsLoading, error: oddsError, refresh: refreshOdds } = useSportsbookOdds(state.games, gender);

  // Auto-fill winners for completed games from ESPN results
  useEffect(() => {
    for (const [gameId, data] of Object.entries(oddsMap)) {
      if (data.completedWinner && state.selections[gameId] !== data.completedWinner) {
        state.setWinner(gameId, data.completedWinner);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oddsMap]);

  // Auto-reveal predictions for any round whose matchups are fully determined
  useEffect(() => {
    if (state.nextPredictableRound) {
      state.predictRound(state.nextPredictableRound);
    }
  }, [state.nextPredictableRound, state.predictRound]);

  return (
    <div className="tournament-view">
      <div className="bracket-container">
        <BracketView
          games={state.games}
          selections={state.selections}
          predictedRounds={state.predictedRounds}
          resolveTeams={state.resolveTeams}
        />
        <PredictionsTable
          games={state.games}
          predictedRounds={state.predictedRounds}
          resolveTeams={state.resolveTeams}
          oddsMap={oddsMap}
          oddsLoading={oddsLoading}
          oddsError={oddsError}
          onRefreshOdds={refreshOdds}
          gender={gender}
        />
      </div>
      <ModelSummary />
    </div>
  );
}
