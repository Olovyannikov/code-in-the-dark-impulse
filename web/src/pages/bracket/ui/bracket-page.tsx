import { Container, Group, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';

import { TournamentModel } from '@/entities/tournament';
import { ResetTournament } from '@/features/tournament-reset';
import { routes } from '@/shared/routes';
import { BracketBoard } from '@/widgets/bracket-board';

export function BracketPage() {
  const { championId, onOpenSetup, onOpenResults } = useUnit({
    championId: TournamentModel.$championId,
    onOpenSetup: routes.setup.open,
    onOpenResults: routes.results.open,
  });

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end">
          <Title order={1}>Сетка</Title>
          <Group>
            <Text style={{ cursor: 'pointer' }} c="dimmed" onClick={() => onOpenSetup()}>
              ← Участники
            </Text>
            {championId && (
              <Text style={{ cursor: 'pointer' }} c="impulse" onClick={() => onOpenResults()}>
                Итоги →
              </Text>
            )}
          </Group>
        </Group>

        <BracketBoard />

        <Group justify="flex-end">
          <ResetTournament />
        </Group>
      </Stack>
    </Container>
  );
}
