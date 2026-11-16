import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Round } from '@/entities/round';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';

import { RoundRunModel } from './round-run.model';
import { TickerModel } from './ticker';

// Тесты намеренно на НАСТОЯЩИХ таймерах: patronum/interval держит
// незавершённый эффект, и под vi.useFakeTimers() allSettled зависает.

const round: Round = {
  id: 'r1',
  kind: 'heat',
  order: 0,
  participantIds: ['a'],
  status: 'pending',
  winnerId: null,
  durationMs: 1_500,
  deadlineAt: null,
  remainingMs: null,
};

function scopeWithRound() {
  return fork({
    values: [
      [
        TournamentModel.$tournament,
        {
          ...EMPTY_TOURNAMENT,
          participants: [{ id: 'a', name: 'Аня' }],
          rounds: [round],
          seededAt: 1,
        },
      ],
    ],
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const statusOf = (scope: ReturnType<typeof fork>) =>
  scope.getState(TournamentModel.$rounds)[0].status;

beforeEach(() => localStorage.clear());

test('часы доводят раунд до timeup, когда их включили до старта', async () => {
  const scope = scopeWithRound();

  await allSettled(TickerModel.tickingEnabled, { scope });
  // Часы уже идут, поэтому allSettled по старту вернётся не раньше,
  // чем цепочка интервала доведёт раунд до конца.
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });

  await sleep(2_600);

  expect(statusOf(scope)).toBe('timeup');
}, 10_000);

test('часы доводят раунд до timeup, когда их включили уже после старта', async () => {
  const scope = scopeWithRound();

  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });
  await allSettled(TickerModel.tickingEnabled, { scope });

  await sleep(2_600);

  expect(statusOf(scope)).toBe('timeup');
}, 10_000);

test('без tickingEnabled часы не идут: раунд остаётся running', async () => {
  const scope = scopeWithRound();

  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });

  await sleep(2_600);

  expect(statusOf(scope)).toBe('running');
}, 10_000);
