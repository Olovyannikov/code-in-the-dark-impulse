import { createHistoryRouter, createRouterControls } from 'atomic-router';
import { createEffect, sample } from 'effector';
import { createHashHistory } from 'history';

import { routePaths } from '@/shared/routes';

export const controls = createRouterControls();

export const router = createHistoryRouter({ routes: routePaths, controls });

/**
 * Hash-история, а не browser: приложение раздаётся с GitHub Pages по подпути
 * /<repo>/, где статика не умеет отдавать index.html на произвольный путь.
 */
export const historyCreatedFx = createEffect(() => createHashHistory());

sample({ clock: historyCreatedFx.doneData, target: router.setHistory });
