import { createEvent, sample } from 'effector';
import { interval } from 'patronum';

import { createModel } from '@/shared/lib/create-model';

import { RoundRunModel } from './round-run.model';

/**
 * Драйвер часов вынесен из модели раунда: patronum/interval держит
 * незавершённый эффект, и любой allSettled по модели ждал бы его вечно.
 * Здесь живёт только подключение к реальному времени, бизнес-правил нет.
 */
export const TickerModel = createModel(() => {
  const tickingEnabled = createEvent();
  const tickingStarted = createEvent();
  const tickingStopped = createEvent();

  const { tick } = interval({ timeout: 1000, start: tickingStarted, stop: tickingStopped });

  sample({
    clock: [tickingEnabled, RoundRunModel.$hasRunningRound],
    source: RoundRunModel.$hasRunningRound,
    filter: Boolean,
    target: tickingStarted,
  });

  sample({
    clock: RoundRunModel.$hasRunningRound,
    filter: (running) => !running,
    target: tickingStopped,
  });

  sample({ clock: tick, fn: () => Date.now(), target: RoundRunModel.ticked });

  return { tickingEnabled };
});
