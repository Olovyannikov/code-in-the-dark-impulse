import { allSettled, fork } from 'effector';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import type { Round } from '@/entities/round';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';

import { RoundRunModel } from './round-run.model';

const NOW = 1_700_000_000_000;

const round: Round = {
  id: 'r1',
  kind: 'heat',
  order: 0,
  participantIds: ['a', 'b'],
  status: 'pending',
  winnerId: null,
  durationMs: 600_000,
  deadlineAt: null,
  remainingMs: null,
};

function scopeWith(overrides: Partial<Round> = {}) {
  return fork({
    values: [
      [
        TournamentModel.$tournament,
        {
          ...EMPTY_TOURNAMENT,
          participants: [
            { id: 'a', name: 'Аня' },
            { id: 'b', name: 'Боря' },
          ],
          rounds: [{ ...round, ...overrides }],
        },
      ],
    ],
  });
}

const firstRound = (scope: ReturnType<typeof fork>) => scope.getState(TournamentModel.$rounds)[0];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => vi.useRealTimers());

test('старт проставляет status running и deadlineAt = now + durationMs', async () => {
  const scope = scopeWith();

  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });

  expect(firstRound(scope).status).toBe('running');
  expect(firstRound(scope).deadlineAt).toBe(NOW + 600_000);
});

test('повторный старт running-раунда ничего не меняет', async () => {
  const scope = scopeWith();
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });
  vi.setSystemTime(NOW + 60_000);

  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });

  expect(firstRound(scope).deadlineAt).toBe(NOW + 600_000);
});

test('пауза превращает deadlineAt в remainingMs', async () => {
  const scope = scopeWith();
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });
  vi.setSystemTime(NOW + 60_000);

  await allSettled(RoundRunModel.roundPaused, { scope, params: 'r1' });

  expect(firstRound(scope).status).toBe('paused');
  expect(firstRound(scope).deadlineAt).toBeNull();
  expect(firstRound(scope).remainingMs).toBe(540_000);
});

test('снятие паузы восстанавливает deadlineAt из remainingMs', async () => {
  const scope = scopeWith({ status: 'paused', remainingMs: 540_000, deadlineAt: null });

  await allSettled(RoundRunModel.roundResumed, { scope, params: 'r1' });

  expect(firstRound(scope).status).toBe('running');
  expect(firstRound(scope).deadlineAt).toBe(NOW + 540_000);
});

test('+2 минуты во время бега сдвигают дедлайн и увеличивают длительность', async () => {
  const scope = scopeWith();
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });

  await allSettled(RoundRunModel.roundTimeExtended, {
    scope,
    params: { roundId: 'r1', deltaMs: 120_000 },
  });

  expect(firstRound(scope).deadlineAt).toBe(NOW + 720_000);
  expect(firstRound(scope).durationMs).toBe(720_000);
});

test('+2 минуты на паузе увеличивают остаток', async () => {
  const scope = scopeWith({ status: 'paused', remainingMs: 100_000, deadlineAt: null });

  await allSettled(RoundRunModel.roundTimeExtended, {
    scope,
    params: { roundId: 'r1', deltaMs: 120_000 },
  });

  expect(firstRound(scope).remainingMs).toBe(220_000);
});

test('тик при истёкшем дедлайне переводит раунд в timeup с нулевым остатком', async () => {
  const scope = scopeWith();
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });
  vi.setSystemTime(NOW + 600_001);

  await allSettled(RoundRunModel.ticked, { scope, params: NOW + 600_001 });

  expect(firstRound(scope).status).toBe('timeup');
  expect(firstRound(scope).remainingMs).toBe(0);
});

test('ноутбук спал: один тик спустя час даёт timeup, а не отрицательный отсчёт', async () => {
  const scope = scopeWith();
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });
  vi.setSystemTime(NOW + 3_600_000);

  await allSettled(RoundRunModel.ticked, { scope, params: NOW + 3_600_000 });

  expect(firstRound(scope).status).toBe('timeup');
  expect(firstRound(scope).remainingMs).toBe(0);
});

test('тик до истечения дедлайна статус не меняет', async () => {
  const scope = scopeWith();
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });

  await allSettled(RoundRunModel.ticked, { scope, params: NOW + 1_000 });

  expect(firstRound(scope).status).toBe('running');
});

test('досрочный стоп переводит раунд в timeup', async () => {
  const scope = scopeWith();
  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });
  vi.setSystemTime(NOW + 120_000);

  await allSettled(RoundRunModel.roundStoppedEarly, { scope, params: 'r1' });

  expect(firstRound(scope).status).toBe('timeup');
  expect(firstRound(scope).remainingMs).toBe(0);
});

test('правка длительности разрешена только в pending', async () => {
  const scope = scopeWith();

  await allSettled(RoundRunModel.roundDurationChanged, {
    scope,
    params: { roundId: 'r1', durationMs: 480_000 },
  });
  expect(firstRound(scope).durationMs).toBe(480_000);

  await allSettled(RoundRunModel.roundStarted, { scope, params: 'r1' });
  await allSettled(RoundRunModel.roundDurationChanged, {
    scope,
    params: { roundId: 'r1', durationMs: 999_000 },
  });

  expect(firstRound(scope).durationMs).toBe(480_000);
});
