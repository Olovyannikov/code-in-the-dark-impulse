import { expect, test } from 'vitest';

import type { Round } from '@/entities/round/@x/tournament';

import { collectHeatWinners, findChampionId } from './bracket';

function heat(order: number, winnerId: string | null): Round {
  return {
    id: `h${order}`,
    kind: 'heat',
    order,
    participantIds: ['a', 'b'],
    status: winnerId ? 'finished' : 'pending',
    winnerId,
    durationMs: 600_000,
    deadlineAt: null,
    remainingMs: null,
  };
}

function final(winnerId: string | null): Round {
  return { ...heat(99, winnerId), id: 'final', kind: 'final' };
}

test('collectHeatWinners возвращает победителей в порядке order отборов', () => {
  const rounds = [heat(2, 'c'), heat(0, 'a'), heat(1, 'b')];

  expect(collectHeatWinners(rounds)).toEqual(['a', 'b', 'c']);
});

test('collectHeatWinners пропускает незавершённые отборы', () => {
  expect(collectHeatWinners([heat(0, 'a'), heat(1, null)])).toEqual(['a']);
});

test('collectHeatWinners не считает финал отбором', () => {
  expect(collectHeatWinners([heat(0, 'a'), final('z')])).toEqual(['a']);
});

test('findChampionId возвращает победителя финала', () => {
  expect(findChampionId([heat(0, 'a'), final('z')])).toBe('z');
});

test('findChampionId возвращает null, пока финал не сыгран', () => {
  expect(findChampionId([heat(0, 'a'), final(null)])).toBeNull();
});

test('findChampionId возвращает null, когда финала ещё нет', () => {
  expect(findChampionId([heat(0, 'a')])).toBeNull();
});
