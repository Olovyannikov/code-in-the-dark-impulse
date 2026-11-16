import { allSettled, fork } from 'effector';
import { beforeEach, expect, test } from 'vitest';

import type { Participant } from '@/entities/participant';
import { EMPTY_TOURNAMENT, TournamentModel } from '@/entities/tournament';
import { FINAL_DURATION_MS, HEAT_DURATION_MS } from '@/shared/config';

import { SeedModel } from './seed.model';

function people(count: number): Participant[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `Участник ${i}` }));
}

function withParticipants(count: number) {
  return { ...EMPTY_TOURNAMENT, participants: people(count) };
}

beforeEach(() => localStorage.clear());

test('жеребьёвка создаёт отборы со статусом pending', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(16)]] });

  await allSettled(SeedModel.seedRequested, { scope });

  const heats = scope.getState(TournamentModel.$heats);
  expect(heats).toHaveLength(4);
  expect(heats.every((round) => round.status === 'pending')).toBe(true);
  expect(heats.every((round) => round.winnerId === null)).toBe(true);
});

test('каждому отбору проставлена длительность и order по порядку', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(16)]] });

  await allSettled(SeedModel.seedRequested, { scope });

  const heats = scope.getState(TournamentModel.$heats);
  expect(heats.map((round) => round.order)).toEqual([0, 1, 2, 3]);
  expect(heats.every((round) => round.durationMs === HEAT_DURATION_MS)).toBe(true);
});

test('финал при жеребьёвке не создаётся', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(16)]] });

  await allSettled(SeedModel.seedRequested, { scope });

  expect(scope.getState(TournamentModel.$finalRound)).toBeNull();
});

test('жеребьёвка проставляет seededAt', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(8)]] });

  await allSettled(SeedModel.seedRequested, { scope });

  expect(scope.getState(TournamentModel.$isSeeded)).toBe(true);
});

test('при четырёх участниках создаётся единственный раунд — он же финал', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(4)]] });

  await allSettled(SeedModel.seedRequested, { scope });

  const final = scope.getState(TournamentModel.$finalRound);
  expect(scope.getState(TournamentModel.$heats)).toHaveLength(0);
  expect(final?.participantIds).toHaveLength(4);
  expect(final?.durationMs).toBe(FINAL_DURATION_MS);
});

test('повторная жеребьёвка пересоздаёт раунды с нуля', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(16)]] });

  await allSettled(SeedModel.seedRequested, { scope });
  const firstIds = scope.getState(TournamentModel.$heats).map((round) => round.id);
  await allSettled(SeedModel.seedRequested, { scope });
  const secondIds = scope.getState(TournamentModel.$heats).map((round) => round.id);

  expect(scope.getState(TournamentModel.$heats)).toHaveLength(4);
  expect(secondIds).not.toEqual(firstIds);
});

test('при одном участнике жеребьёвка не выполняется и объясняет причину', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(1)]] });

  await allSettled(SeedModel.seedRequested, { scope });

  expect(scope.getState(TournamentModel.$rounds)).toHaveLength(0);
  expect(scope.getState(SeedModel.$canSeed)).toBe(false);
  expect(scope.getState(SeedModel.$seedBlockReason)).toMatch(/\S/);
});

test('при 21 участнике жеребьёвка блокируется', async () => {
  const scope = fork({ values: [[TournamentModel.$tournament, withParticipants(21)]] });

  await allSettled(SeedModel.seedRequested, { scope });

  expect(scope.getState(TournamentModel.$rounds)).toHaveLength(0);
  expect(scope.getState(SeedModel.$canSeed)).toBe(false);
});
