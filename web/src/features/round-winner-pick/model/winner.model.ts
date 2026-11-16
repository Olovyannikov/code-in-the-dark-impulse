import { createEvent, sample } from 'effector';

import type { Tournament } from '@/entities/tournament';
import { TournamentModel } from '@/entities/tournament';
import { createModel } from '@/shared/lib/create-model';

import { rebuildFinal } from '../lib/rebuild-final';

type WinnerPick = { roundId: string; winnerId: string };
type FinalistSwap = { outId: string; inId: string };

function pickWinner(tournament: Tournament, { roundId, winnerId }: WinnerPick): Tournament {
  const rounds = tournament.rounds.map((round) => {
    if (round.id !== roundId) return round;
    // Победителем может быть только участник этого раунда.
    if (!round.participantIds.includes(winnerId)) return round;
    return { ...round, status: 'finished' as const, winnerId, deadlineAt: null, remainingMs: 0 };
  });

  return rebuildFinal({ ...tournament, rounds });
}

function reopenRound(tournament: Tournament, roundId: string): Tournament {
  const rounds = tournament.rounds.map((round) =>
    round.id === roundId
      ? {
          ...round,
          status: 'pending' as const,
          winnerId: null,
          deadlineAt: null,
          remainingMs: null,
        }
      : round,
  );

  return rebuildFinal({ ...tournament, rounds });
}

/**
 * Ручная подмена финалиста: победитель отбора отказался от финала.
 * Намеренно не вызывает rebuildFinal — иначе состав тут же пересобрался бы
 * из победителей отборов и подмена пропала.
 */
function replaceFinalist(tournament: Tournament, { outId, inId }: FinalistSwap): Tournament {
  const rounds = tournament.rounds.map((round) => {
    if (round.kind !== 'final') return round;
    if (!round.participantIds.includes(outId)) return round;

    const participantIds = round.participantIds.map((id) => (id === outId ? inId : id));

    return {
      ...round,
      participantIds,
      winnerId: round.winnerId === outId ? null : round.winnerId,
    };
  });

  return { ...tournament, rounds };
}

export const WinnerPickModel = createModel(() => {
  const winnerPicked = createEvent<WinnerPick>();
  const roundReopened = createEvent<string>();
  const finalistReplaced = createEvent<FinalistSwap>();

  sample({
    clock: winnerPicked,
    source: TournamentModel.$tournament,
    fn: pickWinner,
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: roundReopened,
    source: TournamentModel.$tournament,
    fn: reopenRound,
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: finalistReplaced,
    source: TournamentModel.$tournament,
    fn: replaceFinalist,
    target: TournamentModel.tournamentReplaced,
  });

  return { winnerPicked, roundReopened, finalistReplaced };
});
