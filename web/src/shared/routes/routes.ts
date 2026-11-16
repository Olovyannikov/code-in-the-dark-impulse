import { createRoute } from 'atomic-router';

/** Объявления путей домен-независимы и живут в shared, чтобы их видел любой слой. */
export const routes = {
  setup: createRoute(),
  bracket: createRoute(),
  round: createRoute<{ roundId: string }>(),
  results: createRoute(),
};

export const routePaths = [
  { route: routes.setup, path: '/' },
  { route: routes.bracket, path: '/bracket' },
  { route: routes.round, path: '/round/:roundId' },
  { route: routes.results, path: '/results' },
];
