import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';

import { TournamentModel } from '@/entities/tournament';
import { routes } from '@/shared/routes';

export function ResultsPage() {
  const { championId, participants, heats, final, onOpenBracket } = useUnit({
    championId: TournamentModel.$championId,
    participants: TournamentModel.$participants,
    heats: TournamentModel.$heats,
    final: TournamentModel.$finalRound,
    onOpenBracket: routes.bracket.open,
  });

  const nameOf = (id: string | null) =>
    participants.find((person) => person.id === id)?.name ?? '—';

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Group>
          <Button variant="subtle" color="gray" px={0} onClick={() => onOpenBracket()}>
            ← К сетке
          </Button>
        </Group>

        <Card padding="xl" radius="sm" bg="#0b0b0b" style={{ border: '1px solid #262626' }}>
          <Stack align="center" gap="xs">
            <Text c="dimmed" tt="uppercase" size="sm">
              Чемпион
            </Text>
            <Title order={1} style={{ fontSize: 'clamp(40px, 10vw, 96px)', lineHeight: 1 }}>
              {championId ? nameOf(championId) : 'ещё не определён'}
            </Title>
          </Stack>
        </Card>

        <Stack gap="xs">
          <Title order={3}>Победители раундов</Title>
          {heats.map((round, index) => (
            <Group key={round.id} justify="space-between">
              <Text c="dimmed">Отбор {index + 1}</Text>
              <Text fw={500}>{nameOf(round.winnerId)}</Text>
            </Group>
          ))}
          {final && (
            <Group justify="space-between">
              <Text c="dimmed">Финал</Text>
              <Text fw={500}>{nameOf(final.winnerId)}</Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
