import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';
import clsx from 'clsx';

import type { Participant } from '@/entities/participant';
import type { Round } from '@/entities/round';
import { RoundStatusBadge } from '@/entities/round';
import { TournamentModel } from '@/entities/tournament';
import { findMockup, HEAT_SIZE } from '@/shared/config';
import { formatMmSs } from '@/shared/lib/time';
import { routes } from '@/shared/routes';

import classes from './bracket-board.module.css';

type CardProps = {
  round: Round;
  title: string;
  participants: Participant[];
  onOpen: (params: { roundId: string }) => void;
};

function RoundCard({ round, title, participants, onOpen }: CardProps) {
  const nameOf = (id: string) => participants.find((person) => person.id === id)?.name ?? '—';
  const isLive = round.status === 'running' || round.status === 'paused';

  // Свободные места показываем явно: оператор видит, куда сажать опоздавшего.
  const mockup = findMockup(round.mockupId ?? null);
  const freeSeats = Math.max(HEAT_SIZE - round.participantIds.length, 0);
  const seats: (string | null)[] =
    round.status === 'pending'
      ? [...round.participantIds, ...Array<null>(freeSeats).fill(null)]
      : round.participantIds;

  return (
    <Card
      className={classes.card}
      padding="sm"
      radius="sm"
      role="button"
      tabIndex={0}
      data-live={isLive}
      data-done={round.status === 'finished'}
      onClick={() => onOpen({ roundId: round.id })}
      onKeyDown={(event) => event.key === 'Enter' && onOpen({ roundId: round.id })}
    >
      <Stack gap="xs" style={{ flex: 1 }}>
        <Group justify="space-between" wrap="nowrap" align="center">
          <Text fw={500}>{title}</Text>
          <Group gap="xs" wrap="nowrap" align="center">
            <Text size="sm" c="dimmed" className="tnum">
              {formatMmSs(round.durationMs)}
            </Text>
            <RoundStatusBadge status={round.status} />
          </Group>
        </Group>

        {mockup && (
          <Text size="xs" c="impulse" truncate>
            {mockup.title}
          </Text>
        )}

        <Stack gap={2} style={{ flex: 1 }}>
          {seats.map((id, index) => (
            <div key={id ?? `free-${index}`} className={classes.row}>
              <Text size="sm" className={classes.seat}>
                {index + 1}
              </Text>
              {id === null ? (
                <Text size="sm" c="dimmed" fs="italic" style={{ flex: 1 }}>
                  свободно
                </Text>
              ) : (
                <Text size="sm" style={{ flex: 1 }}>
                  {nameOf(id)}
                </Text>
              )}
              {id !== null && round.winnerId === id && (
                <Badge size="sm" color="green" variant="light">
                  победитель
                </Badge>
              )}
            </div>
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

  // Турнир из единственного раунда: дерева нет, рисовать нечего.
  if (heats.length === 0) {
    return (
      <Stack gap="md">
        <Title order={3}>Единственный раунд</Title>
        {final && (
          <RoundCard round={final} title="Финал" participants={participants} onOpen={onOpen} />
        )}
      </Stack>
    );
  }

  return (
    <div className={classes.tree}>
      {heats.map((round, index) => (
        <div key={`heat-${round.id}`} className={classes.heatCell} style={{ gridRow: index + 1 }}>
          <RoundCard
            round={round}
            title={`Отбор ${index + 1}`}
            participants={participants}
            onOpen={onOpen}
          />
        </div>
      ))}

      {heats.map((round, index) => (
        <div
          key={`link-${round.id}`}
          style={{ gridRow: index + 1 }}
          className={clsx(classes.link, {
            [classes.first]: index === 0,
            [classes.last]: index === heats.length - 1,
            [classes.only]: heats.length === 1,
          })}
        />
      ))}

      <div
        className={classes.finalCell}
        style={{ gridRow: `1 / span ${heats.length}` }}
      >
        {final ? (
          <RoundCard round={final} title="Финал" participants={participants} onOpen={onOpen} />
        ) : (
          <Card className={clsx(classes.card, classes.empty)} padding="lg" radius="sm">
            <Stack gap={4}>
              <Text fw={500} c="dimmed">
                Финал
              </Text>
              <Text size="sm" c="dimmed">
                Соберётся сам, когда все отборы будут сыграны.
              </Text>
            </Stack>
          </Card>
        )}
      </div>
    </div>
  );
}
