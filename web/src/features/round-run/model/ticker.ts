import { createEvent, createStore, sample } from 'effector';
import { interval } from 'patronum';

import { createModel } from '@/shared/lib/create-model';

import { RoundRunModel } from './round-run.model';

/**
 * Драйвер часов вынесен из модели раунда: patronum/interval держит
 * незавершённый эффект, и любой allSettled по модели ждал бы его вечно.
 * Здесь живёт только подключение к реальному времени, бизнес-правил нет.
 *
 * Интервал стартует лишь после явного tickingEnabled с границы хоста —
 * иначе он запускался бы в тестах от одного факта «идёт раунд».
 */
export const TickerModel = createModel(() => {
  const tickingEnabled = createEvent();
  const tickingStarted = createEvent();
  const tickingStopped = createEvent();

  const $enabled = createStore(false).on(tickingEnabled, () => true);

  const { tick } = interval({ timeout: 1000, start: tickingStarted, stop: tickingStopped });

  sample({
    clock: [tickingEnabled, RoundRunModel.$hasRunningRound],
    source: { enabled: $enabled, running: RoundRunModel.$hasRunningRound },
    filter: ({ enabled, running }) => enabled && running,
    target: tickingStarted,
  });

  sample({
    clock: RoundRunModel.$hasRunningRound,
    source: $enabled,
    filter: (enabled, running) => enabled && !running,
    target: tickingStopped,
  });

  sample({ clock: tick, fn: () => Date.now(), target: RoundRunModel.ticked });

  return { tickingEnabled };
});
