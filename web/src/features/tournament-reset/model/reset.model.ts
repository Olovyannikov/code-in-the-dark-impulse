import { createEvent, createStore, sample } from 'effector';

import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';
import { createModel } from '@/shared/lib/create-model';

export const ResetModel = createModel(() => {
  const tournamentResetRequested = createEvent();
  const tournamentResetConfirmed = createEvent();
  const tournamentResetCancelled = createEvent();

  const $confirmOpen = createStore(false)
    .on(tournamentResetRequested, () => true)
    .reset(tournamentResetConfirmed, tournamentResetCancelled);

  sample({
    clock: tournamentResetConfirmed,
    fn: () => EMPTY_TOURNAMENT,
    target: TournamentModel.tournamentReplaced,
  });

  return {
    tournamentResetRequested,
    tournamentResetConfirmed,
    tournamentResetCancelled,
    $confirmOpen,
  };
});
