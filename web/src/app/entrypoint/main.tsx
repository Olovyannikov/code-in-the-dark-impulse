import '@mantine/core/styles.css';

import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProvider } from '@/app/providers/app-provider';

import { appStarted } from '../model/app.model';

const scope = fork();

void allSettled(appStarted, { scope });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider value={scope}>
      <AppProvider>
        <div>Code in the Dark</div>
      </AppProvider>
    </Provider>
  </StrictMode>,
);
