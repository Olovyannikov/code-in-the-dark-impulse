import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Round } from '@/entities/round';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';

import { RosterModel } from './roster.model';

function heat(id: string, order: number, ids: string[], status: Round['status'] = 'pending'): Round {
  return {
    id,
    kind: 'heat',
    order,
    participantIds: ids,
    status,
    winnerId: null,
    durationMs: 600_000,
    deadlineAt: null,
    remainingMs: null,
  };
}

function scopeWith(rounds: Round[]) {
  return fork({
    values: [
      [
        TournamentModel.$tournament,
        {
          ...EMPTY_TOURNAMENT,
          participants: ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id.toUpperCase() })),
          rounds,
          seededAt: 1,
        },
      ],
    ],
  });
}

const roundById = (scope: ReturnType<typeof fork>, id: string) =>
  scope.getState(TournamentModel.$rounds).find((round) => round.id === id);

beforeEach(() => localStorage.clear());

test('перенос участника между отборами меняет оба состава', async () => {
  const scope = scopeWith([heat('h0', 0, ['a', 'b']), heat('h1', 1, ['c'])]);

  await allSettled(RosterModel.rosterParticipantMoved, {
    scope,
    params: { participantId: 'b', toRoundId: 'h1' },
  });

  expect(roundById(scope, 'h0')?.participantIds).toEqual(['a']);
  expect(roundById(scope, 'h1')?.participantIds).toEqual(['c', 'b']);
});

test('перенос запрещён, если целевой раунд уже идёт', async () => {
  const scope = scopeWith([heat('h0', 0, ['a', 'b']), heat('h1', 1, ['c'], 'running')]);

  await allSettled(RosterModel.rosterParticipantMoved, {
    scope,
    params: { participantId: 'b', toRoundId: 'h1' },
  });

  expect(roundById(scope, 'h0')?.participantIds).toEqual(['a', 'b']);
  expect(roundById(scope, 'h1')?.participantIds).toEqual(['c']);
});

test('перенос запрещён, если исходный раунд уже идёт', async () => {
  const scope = scopeWith([heat('h0', 0, ['a', 'b'], 'running'), heat('h1', 1, ['c'])]);

  await allSettled(RosterModel.rosterParticipantMoved, {
    scope,
    params: { participantId: 'b', toRoundId: 'h1' },
  });

  expect(roundById(scope, 'h1')?.participantIds).toEqual(['c']);
});

test('удаление из состава не удаляет самого участника', async () => {
  const scope = scopeWith([heat('h0', 0, ['a', 'b'])]);

  await allSettled(RosterModel.rosterParticipantRemoved, {
    scope,
    params: { participantId: 'b', roundId: 'h0' },
  });

  expect(roundById(scope, 'h0')?.participantIds).toEqual(['a']);
  expect(scope.getState(TournamentModel.$participants)).toHaveLength(4);
});

test('опоздавшего можно добавить в непустой отбор', async () => {
  const scope = scopeWith([heat('h0', 0, ['a', 'b'])]);

  await allSettled(RosterModel.rosterParticipantAdded, {
    scope,
    params: { participantId: 'c', roundId: 'h0' },
  });

  expect(roundById(scope, 'h0')?.participantIds).toEqual(['a', 'b', 'c']);
});

test('в идущий раунд опоздавшего не сажаем', async () => {
  const scope = scopeWith([heat('h0', 0, ['a', 'b'], 'running')]);

  await allSettled(RosterModel.rosterParticipantAdded, {
    scope,
    params: { participantId: 'c', roundId: 'h0' },
  });

  expect(roundById(scope, 'h0')?.participantIds).toEqual(['a', 'b']);
});

test('повторное добавление того же человека ничего не меняет', async () => {
  const scope = scopeWith([heat('h0', 0, ['a', 'b'])]);

  await allSettled(RosterModel.rosterParticipantAdded, {
    scope,
    params: { participantId: 'a', roundId: 'h0' },
  });

  expect(roundById(scope, 'h0')?.participantIds).toEqual(['a', 'b']);
});
