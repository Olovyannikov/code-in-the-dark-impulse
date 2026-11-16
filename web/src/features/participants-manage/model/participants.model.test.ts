import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Round } from '@/entities/round';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';

import { ParticipantsModel } from './participants.model';

const round: Round = {
  id: 'h0',
  kind: 'heat',
  order: 0,
  participantIds: ['a', 'b'],
  status: 'finished',
  winnerId: 'a',
  durationMs: 600_000,
  deadlineAt: null,
  remainingMs: 0,
};

function scopeWith(rounds: Round[] = []) {
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
          rounds,
        },
      ],
    ],
  });
}

beforeEach(() => localStorage.clear());

test('добавление участника даёт ему собственный id', async () => {
  const scope = scopeWith();

  await allSettled(ParticipantsModel.participantAdded, { scope, params: 'Вера' });

  const participants = scope.getState(TournamentModel.$participants);
  expect(participants).toHaveLength(3);
  expect(participants[2].name).toBe('Вера');
  expect(new Set(participants.map((p) => p.id)).size).toBe(3);
});

test('два участника с одинаковым именем добавляются как два человека', async () => {
  const scope = scopeWith();

  await allSettled(ParticipantsModel.participantAdded, { scope, params: 'Саша' });
  await allSettled(ParticipantsModel.participantAdded, { scope, params: 'Саша' });

  const sashas = scope.getState(TournamentModel.$participants).filter((p) => p.name === 'Саша');
  expect(sashas).toHaveLength(2);
  expect(sashas[0].id).not.toBe(sashas[1].id);
});

test('пустое имя не добавляется', async () => {
  const scope = scopeWith();

  await allSettled(ParticipantsModel.participantAdded, { scope, params: '   ' });

  expect(scope.getState(TournamentModel.$participants)).toHaveLength(2);
});

test('вставка списком добавляет всех и чистит мусор', async () => {
  const scope = scopeWith();

  await allSettled(ParticipantsModel.participantsPasted, {
    scope,
    params: '1. Вера\n\n- Галя\n  Дима  ',
  });

  expect(scope.getState(TournamentModel.$participants).map((p) => p.name)).toEqual([
    'Аня',
    'Боря',
    'Вера',
    'Галя',
    'Дима',
  ]);
});

test('переименование меняет имя, не трогая id', async () => {
  const scope = scopeWith();

  await allSettled(ParticipantsModel.participantRenamed, {
    scope,
    params: { id: 'a', name: 'Анна' },
  });

  expect(scope.getState(TournamentModel.$participants)[0]).toEqual({ id: 'a', name: 'Анна' });
});

test('удаление участника убирает его из составов раундов', async () => {
  const scope = scopeWith([round]);

  await allSettled(ParticipantsModel.participantRemoved, { scope, params: 'b' });

  expect(scope.getState(TournamentModel.$rounds)[0].participantIds).toEqual(['a']);
});

test('удаление победителя снимает его победу', async () => {
  const scope = scopeWith([round]);

  await allSettled(ParticipantsModel.participantRemoved, { scope, params: 'a' });

  const updated = scope.getState(TournamentModel.$rounds)[0];
  expect(updated.winnerId).toBeNull();
  expect(updated.status).toBe('pending');
});
