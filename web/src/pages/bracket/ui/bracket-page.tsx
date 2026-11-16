import { Button, Container, Group, Stack, Title } from '@mantine/core';
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
    <Container size={1500} py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title order={1}>Сетка</Title>
          <Group gap="xs">
            <Button variant="subtle" color="gray" onClick={() => onOpenSetup()}>
              ← Участники
            </Button>
            {championId && <Button onClick={() => onOpenResults()}>Итоги →</Button>}
            <ResetTournament />
          </Group>
        </Group>

        <BracketBoard />
      </Stack>
    </Container>
  );
}
