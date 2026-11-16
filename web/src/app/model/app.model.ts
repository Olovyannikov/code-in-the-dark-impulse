import { createEvent, createStore, sample } from 'effector';

import { TournamentModel } from '@/entities/tournament';
import { TickerModel } from '@/features/round-run';

/** Единственная точка старта приложения. Всё остальное подключается к ней через sample. */
export const appStarted = createEvent();

export const $isAppReady = createStore(false).on(appStarted, () => true);

// Порядок важен: хранилище поднимается раньше роутера (Task 9), иначе
// оператор после F5 увидит экран ввода участников поверх готовой сетки.
sample({ clock: appStarted, target: TournamentModel.storagePickedUp });

// Часы подключаются к реальному времени только в живом приложении.
sample({ clock: appStarted, target: TickerModel.tickingEnabled });
