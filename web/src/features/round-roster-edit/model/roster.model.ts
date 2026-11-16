import { createEvent, sample } from 'effector';

import type { Round } from '@/entities/round';
import type { Tournament } from '@/entities/tournament';
import { TournamentModel } from '@/entities/tournament';
import { createModel } from '@/shared/lib/create-model';

type Move = { participantId: string; toRoundId: string };
type Removal = { participantId: string; roundId: string };
type Addition = { participantId: string; roundId: string };
type Latecomer = { roundId: string; name: string };

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

/** Опоздавший: человек есть в списке участников, но ни в одном раунде не сидит. */
function addToRoster(tournament: Tournament, { participantId, roundId }: Addition): Tournament {
  const target = tournament.rounds.find((round) => round.id === roundId);

  if (!target || !isEditable(target)) return tournament;
  if (target.participantIds.includes(participantId)) return tournament;

  return {
    ...tournament,
    rounds: tournament.rounds.map((round) =>
      round.id === roundId
        ? { ...round, participantIds: [...round.participantIds, participantId] }
        : round,
    ),
  };
}

/**
 * Опоздавший с улицы: человека может не быть в турнире вовсе.
 * Если такой уже заведён и нигде не сидит — сажаем его, а не плодим двойника.
 */
function addLatecomer(tournament: Tournament, { roundId, name }: Latecomer): Tournament {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length === 0) return tournament;

  const target = tournament.rounds.find((round) => round.id === roundId);
  if (!target || !isEditable(target)) return tournament;

  const seated = new Set(tournament.rounds.flatMap((round) => round.participantIds));
  const free = tournament.participants.find(
    (person) => person.name === clean && !seated.has(person.id),
  );

  const participant = free ?? { id: crypto.randomUUID(), name: clean };

  return addToRoster(
    free
      ? tournament
      : { ...tournament, participants: [...tournament.participants, participant] },
    { participantId: participant.id, roundId },
  );
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
  const rosterParticipantAdded = createEvent<Addition>();
  const latecomerAdded = createEvent<Latecomer>();

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

  sample({
    clock: rosterParticipantAdded,
    source: TournamentModel.$tournament,
    fn: addToRoster,
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: latecomerAdded,
    source: TournamentModel.$tournament,
    fn: addLatecomer,
    target: TournamentModel.tournamentReplaced,
  });

  return {
    rosterParticipantMoved,
    rosterParticipantRemoved,
    rosterParticipantAdded,
    latecomerAdded,
  };
});
