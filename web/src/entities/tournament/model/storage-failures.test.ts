import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import { EMPTY_TOURNAMENT, STORAGE_KEY, TournamentModel } from './tournament.model';

const stored = {
  schemaVersion: 1,
  participants: [{ id: 'p1', name: 'Аня' }],
  rounds: [],
  seededAt: null,
};

beforeEach(() => localStorage.clear());

test('отказ записи не объявляет хранилище битым и не сносит интерфейс', async () => {
  const scope = fork();
  await allSettled(TournamentModel.storagePickedUp, { scope });

  // Квота кончилась: запись падает, чтение исправно.
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = () => {
    throw new DOMException('QuotaExceededError');
  };

  try {
    await allSettled(TournamentModel.tournamentReplaced, { scope, params: stored });
  } finally {
    Storage.prototype.setItem = original;
  }

  expect(scope.getState(TournamentModel.$storageBroken)).toBe(false);
  expect(scope.getState(TournamentModel.$participants)).toHaveLength(1);
});

test('«начать заново» вычищает битые данные из хранилища', async () => {
  localStorage.setItem(STORAGE_KEY, '{это не json');
  const scope = fork();
  await allSettled(TournamentModel.storagePickedUp, { scope });
  expect(scope.getState(TournamentModel.$storageBroken)).toBe(true);

  await allSettled(TournamentModel.brokenStorageDiscarded, { scope });

  expect(scope.getState(TournamentModel.$storageBroken)).toBe(false);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(EMPTY_TOURNAMENT);
});

test('каждый производный стор читается в скоупе независимо от соседей', async () => {
  const seeded = {
    ...EMPTY_TOURNAMENT,
    participants: [
      { id: 'a', name: 'Аня' },
      { id: 'b', name: 'Боря' },
    ],
    rounds: [
      {
        id: 'h0',
        kind: 'heat' as const,
        order: 0,
        participantIds: ['a', 'b'],
        status: 'finished' as const,
        winnerId: 'a',
        durationMs: 600_000,
        deadlineAt: null,
        remainingMs: 0,
      },
    ],
    seededAt: 1,
  };
  const scope = fork({ values: [[TournamentModel.$tournament, seeded]] });

  await allSettled(TournamentModel.storagePickedUp, { scope });

  expect(scope.getState(TournamentModel.$participants)).toHaveLength(2);
  expect(scope.getState(TournamentModel.$rounds)).toHaveLength(1);
  expect(scope.getState(TournamentModel.$heats)).toHaveLength(1);
  expect(scope.getState(TournamentModel.$finalRound)).toBeNull();
  expect(scope.getState(TournamentModel.$heatWinnerIds)).toEqual(['a']);
  expect(scope.getState(TournamentModel.$championId)).toBeNull();
  expect(scope.getState(TournamentModel.$isSeeded)).toBe(true);
});
