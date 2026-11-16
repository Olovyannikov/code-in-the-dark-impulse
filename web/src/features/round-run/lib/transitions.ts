import { match } from 'ts-pattern';

import type { Round } from '@/entities/round';
import type { Tournament } from '@/entities/tournament';

/** Точечно заменяет один раунд, не трогая остальной агрегат. */
export function mapRound(
  tournament: Tournament,
  roundId: string,
  update: (round: Round) => Round,
): Tournament {
  return {
    ...tournament,
    rounds: tournament.rounds.map((round) => (round.id === roundId ? update(round) : round)),
  };
}

export function startRound(round: Round, now: number): Round {
  if (round.status !== 'pending') return round;
  return { ...round, status: 'running', deadlineAt: now + round.durationMs, remainingMs: null };
}

export function pauseRound(round: Round, now: number): Round {
  if (round.status !== 'running' || round.deadlineAt === null) return round;
  return {
    ...round,
    status: 'paused',
    remainingMs: Math.max(round.deadlineAt - now, 0),
    deadlineAt: null,
  };
}

export function resumeRound(round: Round, now: number): Round {
  if (round.status !== 'paused') return round;
  return {
    ...round,
    status: 'running',
    deadlineAt: now + (round.remainingMs ?? round.durationMs),
    remainingMs: null,
  };
}

export function stopRound(round: Round): Round {
  if (round.status !== 'running' && round.status !== 'paused') return round;
  return { ...round, status: 'timeup', deadlineAt: null, remainingMs: 0 };
}

/**
 * Продление увеличивает и дедлайн, и длительность: спека называет это
 * «правкой длительности», а равенство остатка и длительности — то, на чём
 * держится защита от скачка системных часов назад в remainingMsAt.
 */
export function extendRound(round: Round, deltaMs: number): Round {
  return match(round.status)
    .with('running', () => ({
      ...round,
      durationMs: round.durationMs + deltaMs,
      deadlineAt: round.deadlineAt === null ? null : round.deadlineAt + deltaMs,
    }))
    .with('paused', () => ({
      ...round,
      durationMs: round.durationMs + deltaMs,
      remainingMs: (round.remainingMs ?? round.durationMs) + deltaMs,
    }))
    .with('pending', () => ({ ...round, durationMs: round.durationMs + deltaMs }))
    .with('timeup', 'finished', () => round)
    .exhaustive();
}

export function changeDuration(round: Round, durationMs: number): Round {
  if (round.status !== 'pending') return round;
  return { ...round, durationMs };
}

/** Ноль наступает по тику, а не по отдельному таймеру: один источник времени надёжнее двух. */
export function expireIfDue(round: Round, now: number): Round {
  if (round.status !== 'running' || round.deadlineAt === null) return round;
  if (round.deadlineAt > now) return round;
  return { ...round, status: 'timeup', deadlineAt: null, remainingMs: 0 };
}
