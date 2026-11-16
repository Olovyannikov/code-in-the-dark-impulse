import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Round } from '@/entities/round';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';

import { WinnerPickModel } from './winner.model';

function heat(order: number, ids: string[], winnerId: string | null): Round {
  return {
    id: `h${order}`,
    kind: 'heat',
    order,
    participantIds: ids,
    status: winnerId ? 'finished' : 'timeup',
    winnerId,
    durationMs: 600_000,
    deadlineAt: null,
    remainingMs: 0,
  };
}

function scopeWith(rounds: Round[]) {
  return fork({
    values: [
      [
        TournamentModel.$tournament,
        {
          ...EMPTY_TOURNAMENT,
          participants: ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id.toUpperCase() })),
          rounds,
          seededAt: 1,
        },
      ],
    ],
  });
}

beforeEach(() => localStorage.clear());

test('отметка победителя переводит раунд в finished', async () => {
  const scope = scopeWith([heat(0, ['a', 'b'], null)]);

  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: 'h0', winnerId: 'a' },
  });

  const round = scope.getState(TournamentModel.$rounds).find((r) => r.id === 'h0');
  expect(round?.status).toBe('finished');
  expect(round?.winnerId).toBe('a');
});

test('победителем нельзя назначить того, кто не участвовал в раунде', async () => {
  const scope = scopeWith([heat(0, ['a', 'b'], null)]);

  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: 'h0', winnerId: 'd' },
  });

  expect(scope.getState(TournamentModel.$rounds)[0].winnerId).toBeNull();
});

test('последний завершённый отбор создаёт финал', async () => {
  const scope = scopeWith([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], null)]);

  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: 'h1', winnerId: 'c' },
  });

  expect(scope.getState(TournamentModel.$finalRound)?.participantIds).toEqual(['a', 'c']);
});

test('смена победителя отбора после сыгранного финала сбрасывает чемпиона', async () => {
  const scope = scopeWith([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]);
  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: 'h1', winnerId: 'c' },
  });
  const finalId = scope.getState(TournamentModel.$finalRound)!.id;
  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: finalId, winnerId: 'a' },
  });
  expect(scope.getState(TournamentModel.$championId)).toBe('a');

  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: 'h0', winnerId: 'b' },
  });

  expect(scope.getState(TournamentModel.$championId)).toBeNull();
  expect(scope.getState(TournamentModel.$finalRound)?.participantIds).toEqual(['b', 'c']);
});

test('roundReopened возвращает раунд в pending и убирает финал', async () => {
  const scope = scopeWith([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]);
  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: 'h1', winnerId: 'c' },
  });

  await allSettled(WinnerPickModel.roundReopened, { scope, params: 'h0' });

  const round = scope.getState(TournamentModel.$rounds).find((r) => r.id === 'h0');
  expect(round?.status).toBe('pending');
  expect(round?.winnerId).toBeNull();
  expect(scope.getState(TournamentModel.$finalRound)).toBeNull();
});

test('finalistReplaced подменяет финалиста, не трогая отборы', async () => {
  const scope = scopeWith([heat(0, ['a', 'b'], 'a'), heat(1, ['c', 'd'], 'c')]);
  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: 'h1', winnerId: 'c' },
  });

  await allSettled(WinnerPickModel.finalistReplaced, {
    scope,
    params: { outId: 'a', inId: 'b' },
  });

  expect(scope.getState(TournamentModel.$finalRound)?.participantIds).toEqual(['b', 'c']);
  expect(scope.getState(TournamentModel.$heats)[0].winnerId).toBe('a');
});
