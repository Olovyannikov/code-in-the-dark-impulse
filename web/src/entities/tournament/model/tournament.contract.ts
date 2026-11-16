import { and, arr, num, obj, or, val } from '@withease/contracts';
import type { Contract } from '@withease/contracts';

import type { Participant } from '@/entities/participant/@x/tournament';
import { participantContract } from '@/entities/participant/@x/tournament';
import type { Round } from '@/entities/round/@x/tournament';
import { roundContract } from '@/entities/round/@x/tournament';
import { SCHEMA_VERSION } from '@/shared/config';

export type Tournament = {
  schemaVersion: number;
  participants: Participant[];
  rounds: Round[];
  seededAt: number | null;
};

const shapeContract = obj({
  schemaVersion: val(SCHEMA_VERSION),
  participants: arr(participantContract),
  rounds: arr(roundContract),
  seededAt: or(num, val(null)),
});

/**
 * Ссылочная целостность проверяется здесь и больше нигде: дальше код
 * полагается на то, что каждый participantId и winnerId указывает на
 * существующего участника.
 */
const referencesContract: Contract<unknown, Tournament> = {
  isData: (raw): raw is Tournament => collectReferenceErrors(raw as Tournament).length === 0,
  getErrorMessages: (raw) => collectReferenceErrors(raw as Tournament),
};

function collectReferenceErrors(tournament: Tournament): string[] {
  const known = new Set(tournament.participants.map((participant) => participant.id));
  const errors: string[] = [];

  for (const round of tournament.rounds) {
    for (const participantId of round.participantIds) {
      if (!known.has(participantId)) {
        errors.push(`раунд ${round.id}: участник ${participantId} не найден`);
      }
    }

    if (round.winnerId !== null && !known.has(round.winnerId)) {
      errors.push(`раунд ${round.id}: победитель ${round.winnerId} не найден`);
    }

    if (round.winnerId !== null && !round.participantIds.includes(round.winnerId)) {
      errors.push(`раунд ${round.id}: победитель ${round.winnerId} не участвовал в раунде`);
    }
  }

  return errors;
}

export const tournamentContract = and(shapeContract, referencesContract);
