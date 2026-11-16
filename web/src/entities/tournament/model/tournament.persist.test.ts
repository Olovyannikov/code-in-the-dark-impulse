import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Tournament } from './tournament.contract';
import { EMPTY_TOURNAMENT, STORAGE_KEY, TournamentModel } from './tournament.model';

function storedTournament(): Tournament {
  return {
    schemaVersion: 1,
    participants: [{ id: 'p1', name: 'Аня' }],
    rounds: [],
    seededAt: null,
  };
}

beforeEach(() => {
  localStorage.clear();
});

test('валидные данные из localStorage попадают в $tournament', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedTournament()));
  const scope = fork();

  await allSettled(TournamentModel.storagePickedUp, { scope });

  expect(scope.getState(TournamentModel.$tournament)).toEqual(storedTournament());
  expect(scope.getState(TournamentModel.$storageBroken)).toBe(false);
});

test('пустое хранилище даёт EMPTY_TOURNAMENT без признака поломки', async () => {
  const scope = fork();

  await allSettled(TournamentModel.storagePickedUp, { scope });

  expect(scope.getState(TournamentModel.$tournament)).toEqual(EMPTY_TOURNAMENT);
  expect(scope.getState(TournamentModel.$storageBroken)).toBe(false);
});

test('битый JSON поднимает $storageBroken и сохраняет сырой текст', async () => {
  localStorage.setItem(STORAGE_KEY, '{это не json');
  const scope = fork();

  await allSettled(TournamentModel.storagePickedUp, { scope });

  expect(scope.getState(TournamentModel.$storageBroken)).toBe(true);
  expect(scope.getState(TournamentModel.$rawBrokenPayload)).toBe('{это не json');
});

test('чужая schemaVersion поднимает $storageBroken', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...storedTournament(), schemaVersion: 99 }));
  const scope = fork();

  await allSettled(TournamentModel.storagePickedUp, { scope });

  expect(scope.getState(TournamentModel.$storageBroken)).toBe(true);
});

test('чужая schemaVersion не затирает localStorage: данные ещё можно выгрузить', async () => {
  const foreign = JSON.stringify({ ...storedTournament(), schemaVersion: 99 });
  localStorage.setItem(STORAGE_KEY, foreign);
  const scope = fork();

  await allSettled(TournamentModel.storagePickedUp, { scope });
  await allSettled(TournamentModel.tournamentReplaced, { scope, params: storedTournament() });

  expect(localStorage.getItem(STORAGE_KEY)).toBe(foreign);
});

test('изменение турнира пишется в localStorage', async () => {
  const scope = fork();

  await allSettled(TournamentModel.storagePickedUp, { scope });
  await allSettled(TournamentModel.tournamentReplaced, { scope, params: storedTournament() });

  expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(storedTournament());
});
