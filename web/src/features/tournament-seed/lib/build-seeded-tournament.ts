import type { Participant } from '@/entities/participant';
import type { Round } from '@/entities/round';
import type { Tournament } from '@/entities/tournament';
import { FINAL_DURATION_MS, HEAT_DURATION_MS } from '@/shared/config';

/**
 * Собирает турнир из уже перемешанных и разбитых на группы участников.
 * Одна группа означает, что отбирать не из кого: этот раунд и есть финал.
 */
export function buildSeededTournament(
  tournament: Tournament,
  groups: Participant[][],
  now: number,
): Tournament {
  const isSingleRound = groups.length === 1;

  const rounds: Round[] = groups.map((group, index) => ({
    id: crypto.randomUUID(),
    kind: isSingleRound ? 'final' : 'heat',
    order: index,
    participantIds: group.map((participant) => participant.id),
    status: 'pending',
    winnerId: null,
    durationMs: isSingleRound ? FINAL_DURATION_MS : HEAT_DURATION_MS,
    deadlineAt: null,
    remainingMs: null,
  }));

  return { ...tournament, rounds, seededAt: now };
}
