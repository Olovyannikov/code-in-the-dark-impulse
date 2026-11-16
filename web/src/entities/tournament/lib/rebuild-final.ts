import type { Round } from '@/entities/round/@x/tournament';
import { FINAL_DURATION_MS } from '@/shared/config';

import type { Tournament } from '../model/tournament.contract';
import { collectHeatWinners } from './bracket';

const sameMembers = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

/**
 * Единственное место, где решается, существует ли финал и из кого он состоит.
 * Вызывается после любого изменения победителей отборов.
 */
export function rebuildFinal(tournament: Tournament): Tournament {
  const heats = tournament.rounds.filter((round) => round.kind === 'heat');

  // Турнир из единственного раунда: отбирать не из кого, финал уже на месте.
  if (heats.length === 0) return tournament;

  const existingFinal = tournament.rounds.find((round) => round.kind === 'final') ?? null;
  const allHeatsDecided = heats.every((heat) => heat.winnerId !== null);

  if (!allHeatsDecided) {
    return existingFinal === null
      ? tournament
      : { ...tournament, rounds: tournament.rounds.filter((round) => round.kind !== 'final') };
  }

  const finalists = collectHeatWinners(tournament.rounds);

  if (existingFinal !== null && sameMembers(existingFinal.participantIds, finalists)) {
    return tournament;
  }

  const nextFinal: Round = {
    id: existingFinal?.id ?? crypto.randomUUID(),
    kind: 'final',
    order: heats.length,
    participantIds: finalists,
    // Состав изменился — прежний результат финала больше ни о чём не говорит.
    status: 'pending',
    winnerId: null,
    durationMs: existingFinal?.durationMs ?? FINAL_DURATION_MS,
    deadlineAt: null,
    remainingMs: null,
  };

  const withoutFinal = tournament.rounds.filter((round) => round.kind !== 'final');

  return { ...tournament, rounds: [...withoutFinal, nextFinal] };
}
