import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Round } from '@/entities/round';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';

import { MockupPickModel } from './mockup-pick.model';

const round: Round = {
  id: 'h0',
  kind: 'heat',
  order: 0,
  participantIds: ['a'],
  status: 'pending',
  winnerId: null,
  durationMs: 600_000,
  deadlineAt: null,
  remainingMs: null,
};

function scopeWith(rounds: Round[]) {
  return fork({
    values: [
      [
        TournamentModel.$tournament,
        {
          ...EMPTY_TOURNAMENT,
          participants: [{ id: 'a', name: 'Аня' }],
          rounds,
          seededAt: 1,
        },
      ],
    ],
  });
}

const roundById = (scope: ReturnType<typeof fork>, id: string) =>
  scope.getState(TournamentModel.$rounds).find((r) => r.id === id);

beforeEach(() => localStorage.clear());

test('оператор назначает раунду макет', async () => {
  const scope = scopeWith([round]);

  await allSettled(MockupPickModel.mockupAssigned, {
    scope,
    params: { roundId: 'h0', mockupId: 'lvl2-weather' },
  });

  expect(roundById(scope, 'h0')?.mockupId).toBe('lvl2-weather');
});

test('назначение можно снять', async () => {
  const scope = scopeWith([{ ...round, mockupId: 'lvl2-weather' }]);

  await allSettled(MockupPickModel.mockupAssigned, {
    scope,
    params: { roundId: 'h0', mockupId: null },
  });

  expect(roundById(scope, 'h0')?.mockupId).toBeNull();
});

test('несуществующий макет не назначается', async () => {
  const scope = scopeWith([round]);

  await allSettled(MockupPickModel.mockupAssigned, {
    scope,
    params: { roundId: 'h0', mockupId: 'нет-такого' },
  });

  expect(roundById(scope, 'h0')?.mockupId ?? null).toBeNull();
});

test('уже занятые макеты видно: один макет не играется дважды', async () => {
  const scope = scopeWith([
    { ...round, id: 'h0', mockupId: 'lvl1-404' },
    { ...round, id: 'h1', order: 1 },
  ]);

  expect(scope.getState(MockupPickModel.$usedMockupIds)).toEqual(['lvl1-404']);
});

test('макет можно переназначить на другой раунд', async () => {
  const scope = scopeWith([
    { ...round, id: 'h0', mockupId: 'lvl1-404' },
    { ...round, id: 'h1', order: 1 },
  ]);

  await allSettled(MockupPickModel.mockupAssigned, {
    scope,
    params: { roundId: 'h1', mockupId: 'lvl1-404' },
  });

  expect(roundById(scope, 'h1')?.mockupId).toBe('lvl1-404');
});
