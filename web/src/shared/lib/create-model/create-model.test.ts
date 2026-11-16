import { createEvent, createStore, fork, allSettled } from 'effector';
import { expect, test } from 'vitest';

import { createModel } from './create-model';

const CounterModel = createModel(() => {
  const increased = createEvent();
  const $count = createStore(0).on(increased, (count) => count + 1);

  return { increased, $count, viewModel: { count: $count, onIncrease: increased } };
});

test('модель отдаёт работающие юниты', async () => {
  const scope = fork();

  await allSettled(CounterModel.increased, { scope });

  expect(scope.getState(CounterModel.$count)).toBe(1);
});

test('юниты внутри модели получают sid', () => {
  expect(CounterModel.$count.sid).toBeTruthy();
  expect(CounterModel.increased.sid).toBeTruthy();
});

test('viewModel отдаёт те же юниты, что и namespace', () => {
  expect(CounterModel.viewModel.count).toBe(CounterModel.$count);
  expect(CounterModel.viewModel.onIncrease).toBe(CounterModel.increased);
});
