import { createRoutesView, RouterProvider } from 'atomic-router-react';
import type { PropsWithChildren } from 'react';

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
