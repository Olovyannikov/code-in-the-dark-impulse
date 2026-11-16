import type { Participant } from '@/entities/participant';
import type { Tournament } from '@/entities/tournament';
import { rebuildFinal } from '@/entities/tournament';

export function addParticipants(tournament: Tournament, names: string[]): Tournament {
  const added: Participant[] = names.map((name) => ({ id: crypto.randomUUID(), name }));

  return { ...tournament, participants: [...tournament.participants, ...added] };
}

export function renameParticipant(
  tournament: Tournament,
  { id, name }: { id: string; name: string },
): Tournament {
  return {
    ...tournament,
    participants: tournament.participants.map((person) =>
      person.id === id ? { ...person, name } : person,
    ),
  };
}

/**
 * Удаление человека вычищает его из всех составов и снимает его победы:
 * иначе агрегат перестанет проходить проверку ссылочной целостности.
 */
export function removeParticipant(tournament: Tournament, id: string): Tournament {
  return rebuildFinal({
    ...tournament,
    participants: tournament.participants.filter((person) => person.id !== id),
    rounds: tournament.rounds.map((round) => {
      if (!round.participantIds.includes(id) && round.winnerId !== id) return round;

      const wasWinner = round.winnerId === id;

      return {
        ...round,
        participantIds: round.participantIds.filter((participantId) => participantId !== id),
        winnerId: wasWinner ? null : round.winnerId,
        status: wasWinner ? ('pending' as const) : round.status,
      };
    }),
  });
}
