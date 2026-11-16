import { createEvent, createStore } from 'effector';

/** Единственная точка старта приложения. Всё остальное подключается к ней через sample. */
export const appStarted = createEvent();

export const $isAppReady = createStore(false).on(appStarted, () => true);
