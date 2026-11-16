import { combine, createEvent, createStore, sample } from 'effector';
import { once } from 'patronum';

import { TournamentModel } from '@/entities/tournament';
import { TickerModel } from '@/features/round-run';
import { routes } from '@/shared/routes';

import { historyCreatedFx, router } from '../routes/router';

/** Единственная точка старта приложения. Всё остальное подключается к ней через sample. */
export const appStarted = createEvent();

export const $isAppReady = createStore(false).on(appStarted, () => true);

// Порядок строгий и важен именно в таком виде:
// 1. поднимается хранилище,
// 2. только потом создаётся история,
// 3. и лишь когда роутер проинициализировался — выбирается стартовый экран.
// Иначе роутер синхронизируется с адресом «/» раньше, чем станет известно,
// что турнир уже идёт, и оператор после F5 увидит ввод участников
// поверх готовой сетки.
sample({ clock: appStarted, target: TournamentModel.storagePickedUp });

sample({ clock: once(TournamentModel.storagePickupSettled), target: historyCreatedFx });

sample({ clock: appStarted, target: TickerModel.tickingEnabled });

// combine, а не sample({ source }): только combine пересчитывается
// от форкнутых значений, иначе стор застревает на модульном дефолте.
const $startRoute = combine({
  seeded: TournamentModel.$isSeeded,
  championId: TournamentModel.$championId,
  onDefaultScreen: routes.setup.$isOpened,
});

// Перенаправляем только с корневого адреса: если оператор открыл
// конкретный экран ссылкой, его выбор уважаем.
sample({
  clock: router.initialized,
  source: $startRoute,
  filter: ({ seeded, championId, onDefaultScreen }) =>
    onDefaultScreen && seeded && championId === null,
  fn: () => ({}),
  target: routes.bracket.open,
});

sample({
  clock: router.initialized,
  source: $startRoute,
  filter: ({ championId, onDefaultScreen }) => onDefaultScreen && championId !== null,
  fn: () => ({}),
  target: routes.results.open,
});
