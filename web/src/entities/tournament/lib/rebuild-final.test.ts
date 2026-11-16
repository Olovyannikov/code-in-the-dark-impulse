import { expect, test } from 'vitest';

import type { Round } from '@/entities/round/@x/tournament';
import type { Tournament } from '../model/tournament.contract';
import { FINAL_DURATION_MS } from '@/shared/config';

import { rebuildFinal } from './rebuild-final';

function heat(order: number, ids: string[], winnerId: string | null): Round {
  return {
    id: `h${order}`,
    kind: 'heat',
    order,
    participantIds: ids,
    status: winnerId ? 'finished' : 'pending',
    winnerId,
    durationMs: 600_000,
    deadlineAt: null,
    remainingMs: null,
  };
}

function tournament(rounds: Round[]): Tournament {
  return {
    schemaVersion: 1,
    participants: ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id.toUpperCase() })),
    rounds,
    seededAt: 1,
  };
}

const finalOf = (t: Tournament) => t.rounds.find((round) => round.kind === 'final') ?? null;

test('финал не создаётся, пока хотя бы один отбор не завершён', () => {
  const result = rebuildFinal(tournament([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], null)]));

  expect(finalOf(result)).toBeNull();
});

test('последний завершённый отбор создаёт финал из победителей по порядку отборов', () => {
  const result = rebuildFinal(tournament([heat(1, ['c', 'd'], 'c'), heat(0, ['a', 'b'], 'a')]));

  expect(finalOf(result)?.participantIds).toEqual(['a', 'c']);
});

test('финал получает kind final и FINAL_DURATION_MS', () => {
  const result = rebuildFinal(tournament([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]));

  expect(finalOf(result)?.kind).toBe('final');
  expect(finalOf(result)?.durationMs).toBe(FINAL_DURATION_MS);
  expect(finalOf(result)?.status).toBe('pending');
});

test('смена победителя отбора пересобирает состав финала', () => {
  const seeded = rebuildFinal(tournament([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]));
  const changed = {
    ...seeded,
    rounds: seeded.rounds.map((round) =>
      round.id === 'h0' ? { ...round, winnerId: 'b' } : round,
    ),
  };

  const result = rebuildFinal(changed);

  expect(finalOf(result)?.participantIds).toEqual(['b', 'c']);
});

test('смена победителя отбора после сыгранного финала сбрасывает чемпиона', () => {
  const seeded = rebuildFinal(tournament([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]));
  const playedFinal = {
    ...seeded,
    rounds: seeded.rounds.map((round) =>
      round.kind === 'final'
        ? { ...round, status: 'finished' as const, winnerId: 'a' }
        : round.id === 'h0'
          ? { ...round, winnerId: 'b' }
          : round,
    ),
  };

  const result = rebuildFinal(playedFinal);

  expect(finalOf(result)?.winnerId).toBeNull();
  expect(finalOf(result)?.status).toBe('pending');
});

test('неизменившийся состав финала не сбрасывает его результат', () => {
  const seeded = rebuildFinal(tournament([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]));
  const played = {
    ...seeded,
    rounds: seeded.rounds.map((round) =>
      round.kind === 'final' ? { ...round, status: 'finished' as const, winnerId: 'a' } : round,
    ),
  };

  const result = rebuildFinal(played);

  expect(finalOf(result)?.winnerId).toBe('a');
  expect(finalOf(result)?.status).toBe('finished');
});

test('откат отбора в pending убирает финал', () => {
  const seeded = rebuildFinal(tournament([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]));
  const reopened = {
    ...seeded,
    rounds: seeded.rounds.map((round) =>
      round.id === 'h0' ? { ...round, status: 'pending' as const, winnerId: null } : round,
    ),
  };

  expect(finalOf(rebuildFinal(reopened))).toBeNull();
});

test('турнир из единственного финала не трогается', () => {
  const single: Round = {
    id: 'only',
    kind: 'final',
    order: 0,
    participantIds: ['a', 'b', 'c', 'd'],
    status: 'finished',
    winnerId: 'a',
    durationMs: FINAL_DURATION_MS,
    deadlineAt: null,
    remainingMs: null,
  };

  const result = rebuildFinal(tournament([single]));

  expect(finalOf(result)).toEqual(single);
});
