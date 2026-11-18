import { createEvent, sample } from 'effector';

import type { Tournament } from '@/entities/tournament';
import { TournamentModel } from '@/entities/tournament';
import { findMockup } from '@/shared/config';
import { createModel } from '@/shared/lib/create-model';

type Assignment = { roundId: string; mockupId: string | null };

function assignMockup(tournament: Tournament, { roundId, mockupId }: Assignment): Tournament {
  // Назначаем только то, что реально лежит в mockups/ — иначе оператор
  // отправит участников на адрес, которого нет.
  if (mockupId !== null && findMockup(mockupId) === null) return tournament;

  return {
    ...tournament,
    rounds: tournament.rounds.map((round) =>
      round.id === roundId ? { ...round, mockupId } : round,
    ),
  };
}

export const MockupPickModel = createModel(() => {
  const mockupAssigned = createEvent<Assignment>();

  /** Что уже разобрано по раундам — чтобы один макет не сыграли дважды. */
  const $usedMockupIds = TournamentModel.$rounds.map((rounds) =>
    rounds.map((round) => round.mockupId).filter((id): id is string => Boolean(id)),
  );

  sample({
    clock: mockupAssigned,
    source: TournamentModel.$tournament,
    fn: assignMockup,
    target: TournamentModel.tournamentReplaced,
  });

  return { mockupAssigned, $usedMockupIds };
});
