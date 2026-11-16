import { createEvent, sample } from 'effector';

import { canSeed, splitIntoHeats, TournamentModel } from '@/entities/tournament';
import { createModel } from '@/shared/lib/create-model';
import { shuffle } from '@/shared/lib/shuffle';

import { buildSeededTournament } from '../lib/build-seeded-tournament';

export const SeedModel = createModel(() => {
  const seedRequested = createEvent();

  const $verdict = TournamentModel.$participants.map((participants) =>
    canSeed(participants.length),
  );
  const $canSeed = $verdict.map((verdict) => verdict.ok);
  const $seedBlockReason = $verdict.map((verdict) => (verdict.ok ? null : verdict.reason));

  sample({
    clock: seedRequested,
    source: TournamentModel.$tournament,
    filter: $canSeed,
    fn: (tournament) =>
      buildSeededTournament(tournament, splitIntoHeats(shuffle(tournament.participants)), Date.now()),
    target: TournamentModel.tournamentReplaced,
  });

  return {
    seedRequested,
    $canSeed,
    $seedBlockReason,
    viewModel: {
      disabled: $canSeed.map((ok) => !ok),
      reason: $seedBlockReason,
      onClick: seedRequested,
    },
  };
});
