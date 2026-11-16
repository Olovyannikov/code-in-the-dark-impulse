import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';

import type { Participant } from '@/entities/participant';
import type { Round } from '@/entities/round';
import { RoundStatusBadge } from '@/entities/round';
import { TournamentModel } from '@/entities/tournament';
import { routes } from '@/shared/routes';
import { formatMmSs } from '@/shared/lib/time';

type CardProps = {
  round: Round;
  index: number;
  participants: Participant[];
  onOpen: (params: { roundId: string }) => void;
};

function RoundCard({ round, index, participants, onOpen }: CardProps) {
  const nameOf = (id: string) => participants.find((person) => person.id === id)?.name ?? '—';

  return (
    <Card
      withBorder
      padding="md"
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      onClick={() => onOpen({ roundId: round.id })}
      onKeyDown={(event) => event.key === 'Enter' && onOpen({ roundId: round.id })}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>{round.kind === 'final' ? 'Финал' : `Отбор ${index + 1}`}</Text>
          <RoundStatusBadge status={round.status} />
        </Group>

        <Text c="dimmed" size="sm">
          {formatMmSs(round.durationMs)}
        </Text>

        <Stack gap={4}>
          {round.participantIds.map((id) => (
            <Group key={id} gap="xs">
              <Text size="sm">{nameOf(id)}</Text>
              {round.winnerId === id && (
                <Badge size="sm" color="green" variant="light">
                  победитель
                </Badge>
              )}
            </Group>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

export function BracketBoard() {
  const { heats, final, participants, onOpen } = useUnit({
    heats: TournamentModel.$heats,
    final: TournamentModel.$finalRound,
    participants: TournamentModel.$participants,
    onOpen: routes.round.open,
  });

  return (
    <Stack gap="xl">
      {heats.length > 0 && (
        <Stack gap="md">
          <Title order={3}>Отборы</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {heats.map((round, index) => (
              <RoundCard
                key={round.id}
                round={round}
                index={index}
                participants={participants}
                onOpen={onOpen}
              />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      <Stack gap="md">
        <Title order={3}>Финал</Title>
        {final ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <RoundCard round={final} index={0} participants={participants} onOpen={onOpen} />
          </SimpleGrid>
        ) : (
          <Text c="dimmed">Соберётся сам, когда все отборы будут сыграны.</Text>
        )}
      </Stack>
    </Stack>
  );
}
