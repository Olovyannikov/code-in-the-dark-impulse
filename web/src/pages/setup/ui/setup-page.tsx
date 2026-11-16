import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';

import { TournamentModel } from '@/entities/tournament';
import { ParticipantsEditor } from '@/features/participants-manage';
import { SeedButton } from '@/features/tournament-seed';
import { routes } from '@/shared/routes';

export function SetupPage() {
  const { seeded, onOpenBracket } = useUnit({
    seeded: TournamentModel.$isSeeded,
    onOpenBracket: routes.bracket.open,
  });

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>Code in the Dark</Title>
          <Text c="dimmed">Импульс 2026 · 19 ноября</Text>
        </Stack>

        <ParticipantsEditor />

        <Group justify="space-between">
          <SeedButton />
          {seeded && <Button onClick={() => onOpenBracket()}>К сетке →</Button>}
        </Group>
      </Stack>
    </Container>
  );
}
