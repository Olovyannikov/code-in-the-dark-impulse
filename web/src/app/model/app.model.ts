import { createEvent, createStore, sample } from 'effector';

import { TournamentModel } from '@/entities/tournament';

/** Единственная точка старта приложения. Всё остальное подключается к ней через sample. */
export const appStarted = createEvent();

export const $isAppReady = createStore(false).on(appStarted, () => true);

// Порядок важен: хранилище поднимается раньше роутера (Task 9), иначе
// оператор после F5 увидит экран ввода участников поверх готовой сетки.
sample({ clock: appStarted, target: TournamentModel.storagePickedUp });
