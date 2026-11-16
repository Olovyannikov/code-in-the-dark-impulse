import { expect, test } from 'vitest';

import type { Round } from '@/entities/round';

import { pauseRound, startRound } from './transitions';

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

test('часы откатились назад на 5 минут: пауза не выдаёт раунду лишнего времени', () => {
  const started = startRound(base, 1_000_000);

  // NTP откатил системные часы на пять минут, оператор жмёт «Пауза».
  const paused = pauseRound(started, 1_000_000 - 300_000);

  expect(paused.remainingMs).toBe(600_000);
  expect(paused.remainingMs).toBeLessThanOrEqual(paused.durationMs);
});

test('обычная пауза считает остаток честно', () => {
  const started = startRound(base, 1_000_000);

  expect(pauseRound(started, 1_000_000 + 60_000).remainingMs).toBe(540_000);
});
