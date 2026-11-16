import { match } from 'ts-pattern';

import type { Round } from '@/entities/round';

/**
 * Остаток всегда вычисляется из абсолютного deadlineAt, а не накапливается тиками:
 * браузер троттлит интервалы в фоновой вкладке, и счётчик-накопитель отстал бы
 * на минуты за десятиминутный раунд.
 *
 * Чистая функция: `now` передаётся снаружи, Date.now() внутри не вызывается.
 */
export function remainingMsAt(round: Round, now: number): number {
  return match(round.status)
    .with('pending', () => round.durationMs)
    .with('running', () => {
      if (round.deadlineAt === null) return round.durationMs;
      // Верхняя граница защищает от скачка системных часов назад,
      // нижняя — от сна ноутбука, после которого дедлайн давно в прошлом.
      return Math.min(Math.max(round.deadlineAt - now, 0), round.durationMs);
    })
    .with('paused', () => round.remainingMs ?? round.durationMs)
    .with('timeup', () => 0)
    .with('finished', () => round.remainingMs ?? 0)
    .exhaustive();
}
