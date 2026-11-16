import { createFactory, invoke } from '@withease/factories';
import type { Effect, EventCallable, Store } from 'effector';

/** Контракт для UI: что view читает (сторы) и что может вызвать (onXxx). Совпадает с формой bind у reflect. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- события инвариантны по payload, иначе не описать
export type ViewModel = Record<string, EventCallable<any> | Effect<any, any, any> | Store<any>>;

/**
 * Модель-namespace. `viewModel` — единственное, что видит UI (через `reflect({ bind })`);
 * остальное — API для других моделей.
 *
 *   export const SeedModel = createModel(() => {
 *     const seedRequested = createEvent();
 *     const $canSeed = createStore(false);
 *     return { seedRequested, $canSeed, viewModel: { disabled: $canSeed.map((ok) => !ok), onClick: seedRequested } };
 *   });
 */
export const createModel = <T extends object>(builder: () => T): T =>
  // invoke не выводит тип через обобщённый builder — результат фабрики и есть T.
  invoke(createFactory(builder)) as T;
