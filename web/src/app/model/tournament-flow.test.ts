import { allSettled, fork } from 'effector';
import { beforeEach, expect, test, vi } from 'vitest';

import { TournamentModel } from '@/entities/tournament';
import { ParticipantsModel } from '@/features/participants-manage';
import { RoundRunModel } from '@/features/round-run';
import { WinnerPickModel } from '@/features/round-winner-pick';
import { SeedModel } from '@/features/tournament-seed';

import { appStarted } from './app.model';

const NOW = 1_700_000_000_000;

const SIXTEEN = Array.from({ length: 16 }, (_, i) => `Участник ${i + 1}`).join('\n');

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  return () => vi.useRealTimers();
});

test('вечер целиком: 16 человек, четыре отбора, финал, чемпион', async () => {
  const scope = fork();
  await allSettled(appStarted, { scope });

  // Оператор вставляет список и жмёт жеребьёвку.
  await allSettled(ParticipantsModel.participantsPasted, { scope, params: SIXTEEN });
  expect(scope.getState(SeedModel.$canSeed)).toBe(true);

  await allSettled(SeedModel.seedRequested, { scope });
  const heats = scope.getState(TournamentModel.$heats);
  expect(heats.map((round) => round.participantIds.length)).toEqual([4, 4, 4, 4]);
  expect(scope.getState(TournamentModel.$finalRound)).toBeNull();

  // Четыре отбора: старт, пауза, продление, продолжение, время вышло, победитель.
  for (const [index, heat] of heats.entries()) {
    await allSettled(RoundRunModel.roundStarted, { scope, params: heat.id });

    if (index === 0) {
      vi.setSystemTime(NOW + 60_000);
      await allSettled(RoundRunModel.roundPaused, { scope, params: heat.id });
      await allSettled(RoundRunModel.roundTimeExtended, {
        scope,
        params: { roundId: heat.id, deltaMs: 120_000 },
      });
      await allSettled(RoundRunModel.roundResumed, { scope, params: heat.id });
    }

    await allSettled(RoundRunModel.roundStoppedEarly, { scope, params: heat.id });

    const current = scope.getState(TournamentModel.$rounds).find((r) => r.id === heat.id)!;
    expect(current.status).toBe('timeup');

    await allSettled(WinnerPickModel.winnerPicked, {
      scope,
      params: { roundId: heat.id, winnerId: current.participantIds[0] },
    });
  }

  // Финал собрался сам из четырёх победителей.
  const final = scope.getState(TournamentModel.$finalRound);
  expect(final).not.toBeNull();
  expect(final!.participantIds).toHaveLength(4);
  expect(final!.durationMs).toBe(900_000);

  await allSettled(RoundRunModel.roundStarted, { scope, params: final!.id });
  vi.setSystemTime(NOW + 10_000_000);
  await allSettled(RoundRunModel.ticked, { scope, params: NOW + 10_000_000 });
  expect(scope.getState(TournamentModel.$finalRound)!.status).toBe('timeup');

  await allSettled(WinnerPickModel.winnerPicked, {
    scope,
    params: { roundId: final!.id, winnerId: final!.participantIds[2] },
  });

  expect(scope.getState(TournamentModel.$championId)).toBe(final!.participantIds[2]);
});

test('F5 посреди турнира: состояние и дедлайн переживают перезагрузку', async () => {
  const first = fork();
  await allSettled(appStarted, { scope: first });
  await allSettled(ParticipantsModel.participantsPasted, { scope: first, params: SIXTEEN });
  await allSettled(SeedModel.seedRequested, { scope: first });
  const heatId = first.getState(TournamentModel.$heats)[0].id;
  await allSettled(RoundRunModel.roundStarted, { scope: first, params: heatId });

  const deadlineBefore = first
    .getState(TournamentModel.$rounds)
    .find((round) => round.id === heatId)!.deadlineAt;

  // Новая вкладка после перезагрузки: состояние поднимается из localStorage.
  const second = fork();
  await allSettled(appStarted, { scope: second });

  const restored = second
    .getState(TournamentModel.$rounds)
    .find((round) => round.id === heatId);

  expect(restored?.status).toBe('running');
  expect(restored?.deadlineAt).toBe(deadlineBefore);
});
