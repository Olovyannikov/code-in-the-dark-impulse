import { allSettled, fork } from 'effector';
import { expect, test } from 'vitest';

import { $isAppReady, appStarted } from './app.model';

test('appStarted запускается в изолированном скоупе', async () => {
  const scope = fork();

  await allSettled(appStarted, { scope });

  expect(scope.getState($isAppReady)).toBe(true);
});

test('до appStarted приложение не готово', () => {
  const scope = fork();

  expect(scope.getState($isAppReady)).toBe(false);
});
