import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { fork } from 'effector';
import { Provider } from 'effector-react';
import { expect, test } from 'vitest';

import { TournamentModel } from '@/entities/tournament';

import { BrokenStoragePage } from './broken-storage-page';

function renderInScope(scope: ReturnType<typeof fork>) {
  return render(
    <Provider value={scope}>
      <MantineProvider>
        <BrokenStoragePage />
      </MantineProvider>
    </Provider>,
  );
}

test('экран объясняет, что случилось, и предлагает выгрузку', () => {
  const scope = fork({
    values: [
      [TournamentModel.$storageBroken, true],
      [TournamentModel.$rawBrokenPayload, '{битые данные'],
    ],
  });

  renderInScope(scope);

  expect(screen.getByRole('button', { name: /начать заново/i })).toBeTruthy();
  expect(screen.getByRole('button', { name: /выгрузить/i })).toBeTruthy();
});

test('кнопка выгрузки недоступна, когда выгружать нечего', () => {
  const scope = fork({
    values: [
      [TournamentModel.$storageBroken, true],
      [TournamentModel.$rawBrokenPayload, null],
    ],
  });

  renderInScope(scope);

  const download = screen.getByRole('button', { name: /выгрузить/i }) as HTMLButtonElement;
  expect(download.disabled).toBe(true);
});
