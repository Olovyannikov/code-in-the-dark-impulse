import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Round } from '@/entities/round';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';
import { routes } from '@/shared/routes';

import { appStarted } from '../model/app.model';

const final = (winnerId: string | null): Round => ({
  id: 'f',
  kind: 'final',
  order: 1,
  participantIds: ['a', 'b'],
  status: winnerId ? 'finished' : 'pending',
  winnerId,
  durationMs: 900_000,
  deadlineAt: null,
  remainingMs: null,
});

function scopeWith(tournament = EMPTY_TOURNAMENT) {
  return fork({ values: [[TournamentModel.$tournament, tournament]] });
}

const participants = [
  { id: 'a', name: 'Аня' },
  { id: 'b', name: 'Боря' },
];

beforeEach(() => {
  localStorage.clear();
  // Hash-история живёт в общем на все тесты window: без сброса адрес
  // предыдущего теста утекает в следующий.
  window.location.hash = '';
});

test('без жеребьёвки appStarted открывает setup', async () => {
  const scope = scopeWith();

  await allSettled(appStarted, { scope });

  expect(scope.getState(routes.setup.$isOpened)).toBe(true);
});

test('с готовой сеткой и без чемпиона appStarted открывает bracket', async () => {
  const scope = scopeWith({
    ...EMPTY_TOURNAMENT,
    participants,
    rounds: [final(null)],
    seededAt: 1,
  });

  await allSettled(appStarted, { scope });

  expect(scope.getState(routes.bracket.$isOpened)).toBe(true);
  expect(scope.getState(routes.setup.$isOpened)).toBe(false);
});

test('с определившимся чемпионом appStarted открывает results', async () => {
  const scope = scopeWith({
    ...EMPTY_TOURNAMENT,
    participants,
    rounds: [final('a')],
    seededAt: 1,
  });

  await allSettled(appStarted, { scope });

  expect(scope.getState(routes.results.$isOpened)).toBe(true);
});

test('турнир, поднятый из localStorage, определяет стартовый экран', async () => {
  localStorage.setItem(
    'citd-tournament',
    JSON.stringify({ schemaVersion: 1, participants, rounds: [final(null)], seededAt: 1 }),
  );
  const scope = fork();

  await allSettled(appStarted, { scope });

  expect(scope.getState(routes.bracket.$isOpened)).toBe(true);
});
