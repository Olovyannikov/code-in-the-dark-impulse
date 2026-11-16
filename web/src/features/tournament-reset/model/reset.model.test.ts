import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';

import { ResetModel } from './reset.model';

function scopeWithTournament() {
  return fork({
    values: [
      [
        TournamentModel.$tournament,
        { ...EMPTY_TOURNAMENT, participants: [{ id: 'a', name: 'Аня' }], seededAt: 1 },
      ],
    ],
  });
}

beforeEach(() => localStorage.clear());

test('запрос сброса только открывает подтверждение и ничего не стирает', async () => {
  const scope = scopeWithTournament();

  await allSettled(ResetModel.tournamentResetRequested, { scope });

  expect(scope.getState(ResetModel.$confirmOpen)).toBe(true);
  expect(scope.getState(TournamentModel.$participants)).toHaveLength(1);
});

test('подтверждение обнуляет турнир и закрывает окно', async () => {
  const scope = scopeWithTournament();
  await allSettled(ResetModel.tournamentResetRequested, { scope });

  await allSettled(ResetModel.tournamentResetConfirmed, { scope });

  expect(scope.getState(TournamentModel.$tournament)).toEqual(EMPTY_TOURNAMENT);
  expect(scope.getState(ResetModel.$confirmOpen)).toBe(false);
});

test('отмена закрывает окно и оставляет турнир на месте', async () => {
  const scope = scopeWithTournament();
  await allSettled(ResetModel.tournamentResetRequested, { scope });

  await allSettled(ResetModel.tournamentResetCancelled, { scope });

  expect(scope.getState(ResetModel.$confirmOpen)).toBe(false);
  expect(scope.getState(TournamentModel.$participants)).toHaveLength(1);
});
