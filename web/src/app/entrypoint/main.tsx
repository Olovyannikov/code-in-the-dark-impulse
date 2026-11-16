import '@mantine/core/styles.css';

import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProvider } from '@/app/providers/app-provider';
import { AppRouterProvider, AppScreen } from '@/app/providers/router-provider';

import { TickerModel } from '@/features/round-run';

import { appStarted } from '../model/app.model';

const scope = fork();

void allSettled(appStarted, { scope }).then(() =>
  // Граница хоста: часы цепляются к реальному времени только в живом
  // приложении. В тестах этот модуль не исполняется.
  allSettled(TickerModel.tickingEnabled, { scope }),
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider value={scope}>
      <AppProvider>
        <AppRouterProvider>
          <AppScreen />
        </AppRouterProvider>
      </AppProvider>
    </Provider>
  </StrictMode>,
);
