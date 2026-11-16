import { allSettled, fork } from 'effector';
import { expect, test } from 'vitest';

import { TournamentModel } from '@/entities/tournament';

import { $isAppReady, appStarted } from './app.model';

test('appStarted запускается в изолированном скоупе', async () => {
  const scope = fork();

  await allSettled(appStarted, { scope });

  expect(scope.getState($isAppReady)).toBe(true);
});

test('до appStarted приложение не готово', () => {
  const scope = fork();

  expect(scope.getState($isAppReady)).toBe(false);
});

test('appStarted поднимает сохранённый турнир', async () => {
  localStorage.setItem(
    'citd-tournament',
    JSON.stringify({ schemaVersion: 1, participants: [{ id: 'p1', name: 'Аня' }], rounds: [], seededAt: null }),
  );
  const scope = fork();

  await allSettled(appStarted, { scope });

  expect(scope.getState(TournamentModel.$participants)).toEqual([{ id: 'p1', name: 'Аня' }]);
  localStorage.clear();
});
