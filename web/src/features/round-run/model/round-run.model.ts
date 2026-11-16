import { createEvent, createStore, sample } from 'effector';

import { TournamentModel } from '@/entities/tournament';
import { createModel } from '@/shared/lib/create-model';

import {
  changeDuration,
  expireIfDue,
  extendRound,
  mapRound,
  pauseRound,
  resumeRound,
  startRound,
  stopRound,
} from '../lib/transitions';

type RoundAmount = { roundId: string; deltaMs: number };
type RoundDuration = { roundId: string; durationMs: number };

export const RoundRunModel = createModel(() => {
  const roundStarted = createEvent<string>();
  const roundPaused = createEvent<string>();
  const roundResumed = createEvent<string>();
  const roundStoppedEarly = createEvent<string>();
  const roundTimeExtended = createEvent<RoundAmount>();
  const roundDurationChanged = createEvent<RoundDuration>();

  /** Тик только перерисовывает: остаток всегда считается из deadlineAt. */
  const ticked = createEvent<number>();
  const $tick = createStore(Date.now()).on(ticked, (_, now) => now);

  const $hasRunningRound = TournamentModel.$rounds.map((rounds) =>
    rounds.some((round) => round.status === 'running'),
  );

  sample({
    clock: roundStarted,
    source: TournamentModel.$tournament,
    fn: (tournament, roundId) =>
      mapRound(tournament, roundId, (round) => startRound(round, Date.now())),
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: roundPaused,
    source: TournamentModel.$tournament,
    fn: (tournament, roundId) =>
      mapRound(tournament, roundId, (round) => pauseRound(round, Date.now())),
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: roundResumed,
    source: TournamentModel.$tournament,
    fn: (tournament, roundId) =>
      mapRound(tournament, roundId, (round) => resumeRound(round, Date.now())),
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: roundStoppedEarly,
    source: TournamentModel.$tournament,
    fn: (tournament, roundId) => mapRound(tournament, roundId, stopRound),
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: roundTimeExtended,
    source: TournamentModel.$tournament,
    fn: (tournament, { roundId, deltaMs }) =>
      mapRound(tournament, roundId, (round) => extendRound(round, deltaMs)),
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: roundDurationChanged,
    source: TournamentModel.$tournament,
    fn: (tournament, { roundId, durationMs }) =>
      mapRound(tournament, roundId, (round) => changeDuration(round, durationMs)),
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: ticked,
    source: TournamentModel.$tournament,
    filter: (tournament, now) =>
      tournament.rounds.some((round) => expireIfDue(round, now) !== round),
    fn: (tournament, now) => ({
      ...tournament,
      rounds: tournament.rounds.map((round) => expireIfDue(round, now)),
    }),
    target: TournamentModel.tournamentReplaced,
  });

  return {
    roundStarted,
    roundPaused,
    roundResumed,
    roundStoppedEarly,
    roundTimeExtended,
    roundDurationChanged,
    ticked,
    $tick,
    $hasRunningRound,
  };
});
