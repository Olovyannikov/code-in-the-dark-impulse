import { createEvent, sample } from 'effector';

import type { Round } from '@/entities/round';
import type { Tournament } from '@/entities/tournament';
import { TournamentModel } from '@/entities/tournament';
import { createModel } from '@/shared/lib/create-model';

type Move = { participantId: string; toRoundId: string };
type Removal = { participantId: string; roundId: string };

/** Состав идущего раунда не трогаем: люди уже сидят за машинами. */
const isEditable = (round: Round) => round.status === 'pending';

function moveParticipant(tournament: Tournament, { participantId, toRoundId }: Move): Tournament {
  const target = tournament.rounds.find((round) => round.id === toRoundId);
  const source = tournament.rounds.find((round) => round.participantIds.includes(participantId));

  if (!target || !source || !isEditable(target) || !isEditable(source)) return tournament;
  if (source.id === target.id) return tournament;

  return {
    ...tournament,
    rounds: tournament.rounds.map((round) => {
      if (round.id === source.id) {
        return {
          ...round,
          participantIds: round.participantIds.filter((id) => id !== participantId),
          winnerId: round.winnerId === participantId ? null : round.winnerId,
        };
      }

      if (round.id === target.id) {
        return { ...round, participantIds: [...round.participantIds, participantId] };
      }

      return round;
    }),
  };
}

function removeFromRoster(tournament: Tournament, { participantId, roundId }: Removal): Tournament {
  return {
    ...tournament,
    rounds: tournament.rounds.map((round) => {
      if (round.id !== roundId || !isEditable(round)) return round;

      return {
        ...round,
        participantIds: round.participantIds.filter((id) => id !== participantId),
        winnerId: round.winnerId === participantId ? null : round.winnerId,
      };
    }),
  };
}

export const RosterModel = createModel(() => {
  const rosterParticipantMoved = createEvent<Move>();
  const rosterParticipantRemoved = createEvent<Removal>();

  sample({
    clock: rosterParticipantMoved,
    source: TournamentModel.$tournament,
    fn: moveParticipant,
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: rosterParticipantRemoved,
    source: TournamentModel.$tournament,
    fn: removeFromRoster,
    target: TournamentModel.tournamentReplaced,
  });

  return { rosterParticipantMoved, rosterParticipantRemoved };
});
