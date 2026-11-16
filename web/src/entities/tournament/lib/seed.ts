import type { Participant } from '@/entities/participant/@x/tournament';
import { HEAT_SIZE, MAX_HEATS, MIN_HEAT_SIZE } from '@/shared/config';

export type SeedVerdict = { ok: true } | { ok: false; reason: string };

const MAX_PARTICIPANTS = MAX_HEATS * HEAT_SIZE;

export function canSeed(count: number): SeedVerdict {
  if (count < MIN_HEAT_SIZE) {
    return { ok: false, reason: `Нужно хотя бы ${MIN_HEAT_SIZE} участника — сейчас ${count}.` };
  }

  if (count > MAX_PARTICIPANTS) {
    return {
      ok: false,
      reason:
        `Больше ${MAX_PARTICIPANTS} участников не помещается: это ${MAX_HEATS} отборов, ` +
        'а их победители уже не влезают в один финал. Нужен дополнительный круг, которого нет.',
    };
  }

  return { ok: true };
}

/**
 * Делит участников на отборы равномерно: 14 человек дают 4/4/3/3, а не 4/4/4/2.
 * Неполный отбор — норма вечера, а не ошибка.
 */
export function splitIntoHeats(participants: readonly Participant[]): Participant[][] {
  if (participants.length === 0) return [];

  const heatCount = Math.ceil(participants.length / HEAT_SIZE);
  const base = Math.floor(participants.length / heatCount);
  const withExtra = participants.length % heatCount;

  const heats: Participant[][] = [];
  let cursor = 0;

  for (let index = 0; index < heatCount; index += 1) {
    const size = base + (index < withExtra ? 1 : 0);
    heats.push(participants.slice(cursor, cursor + size));
    cursor += size;
  }

  return heats;
}
