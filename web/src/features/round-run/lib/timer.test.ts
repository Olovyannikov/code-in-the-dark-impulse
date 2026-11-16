import { expect, test } from 'vitest';

import type { Round } from '@/entities/round';

import { remainingMsAt } from './timer';

const base: Round = {
  id: 'r1',
  kind: 'heat',
  order: 0,
  participantIds: ['a'],
  status: 'pending',
  winnerId: null,
  durationMs: 600_000,
  deadlineAt: null,
  remainingMs: null,
};

test('pending: остаток равен durationMs', () => {
  expect(remainingMsAt(base, 1_000)).toBe(600_000);
});

test('running: остаток считается как deadlineAt - now', () => {
  const round: Round = { ...base, status: 'running', deadlineAt: 1_000 + 540_000 };

  expect(remainingMsAt(round, 1_000)).toBe(540_000);
});

test('running: deadlineAt в прошлом даёт ровно 0, а не отрицательное число', () => {
  const round: Round = { ...base, status: 'running', deadlineAt: 1_000 };

  expect(remainingMsAt(round, 5_000)).toBe(0);
});

test('ноутбук спал час: остаток 0, а не минус час', () => {
  const round: Round = { ...base, status: 'running', deadlineAt: 1_000 };

  expect(remainingMsAt(round, 1_000 + 3_600_000)).toBe(0);
});

test('часы ушли назад: остаток не превышает durationMs', () => {
  const round: Round = { ...base, status: 'running', deadlineAt: 1_000_000 };

  expect(remainingMsAt(round, 1_000_000 - 5_000_000)).toBe(600_000);
});

test('paused: остаток берётся из remainingMs и не зависит от now', () => {
  const round: Round = { ...base, status: 'paused', deadlineAt: null, remainingMs: 123_000 };

  expect(remainingMsAt(round, 1_000)).toBe(123_000);
  expect(remainingMsAt(round, 9_999_999)).toBe(123_000);
});

test('часы ушли назад и раунд поставили на паузу: остаток не превышает durationMs', () => {
  const round: Round = { ...base, status: 'paused', deadlineAt: null, remainingMs: 900_000 };

  expect(remainingMsAt(round, 1_000)).toBe(600_000);
});

test('timeup: остаток 0', () => {
  const round: Round = { ...base, status: 'timeup', remainingMs: 0 };

  expect(remainingMsAt(round, 1_000)).toBe(0);
});

test('finished: остаток — то, что осталось на момент завершения', () => {
  const round: Round = { ...base, status: 'finished', remainingMs: 42_000 };

  expect(remainingMsAt(round, 9_999_999)).toBe(42_000);
});
