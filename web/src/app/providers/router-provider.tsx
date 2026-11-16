import { createRoutesView, RouterProvider } from 'atomic-router-react';
import { useUnit } from 'effector-react';
import type { PropsWithChildren } from 'react';

import { TournamentModel } from '@/entities/tournament';
import { BrokenStoragePage } from '@/pages/broken-storage';

import { BracketPage } from '@/pages/bracket';
import { ResultsPage } from '@/pages/results';
import { RoundPage } from '@/pages/round';
import { SetupPage } from '@/pages/setup';
import { routes } from '@/shared/routes';

import { router } from '../routes/router';

export const RoutesView = createRoutesView({
  routes: [
    { route: routes.setup, view: SetupPage },
    { route: routes.bracket, view: BracketPage },
    { route: routes.round, view: RoundPage },
    { route: routes.results, view: ResultsPage },
  ],
});

export function AppRouterProvider({ children }: PropsWithChildren) {
  return <RouterProvider router={router}>{children}</RouterProvider>;
}

/**
 * Пока хранилище признано повреждённым, роуты не показываем: любое действие
 * оператора затёрло бы данные, которые он ещё может выгрузить.
 */
export function AppScreen() {
  const broken = useUnit(TournamentModel.$storageBroken);

  if (broken) return <BrokenStoragePage />;

  return <RoutesView />;
}
