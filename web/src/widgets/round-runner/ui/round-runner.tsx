import { Alert, Card, Group, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';

import { RoundStatusBadge } from '@/entities/round';
import { TournamentModel } from '@/entities/tournament';
import { remainingMsAt, RoundControls, RoundRunModel } from '@/features/round-run';
import { RosterEditor } from '@/features/round-roster-edit';
import { FinalistSwap, WinnerPicker } from '@/features/round-winner-pick';
import { formatMmSs } from '@/shared/lib/time';
import { routes } from '@/shared/routes';

export function RoundRunner() {
  const { rounds, participants, tick, params } = useUnit({
    rounds: TournamentModel.$rounds,
    participants: TournamentModel.$participants,
    tick: RoundRunModel.$tick,
    params: routes.round.$params,
  });

  const round = rounds.find((item) => item.id === params.roundId);

  if (!round) {
    return <Text c="dimmed">Раунд не найден. Вернись к сетке.</Text>;
  }

  const remaining = remainingMsAt(round, tick);
  const isOver = round.status === 'timeup' || round.status === 'finished';

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={2}>{round.kind === 'final' ? 'Финал' : `Отбор ${round.order + 1}`}</Title>
        <RoundStatusBadge status={round.status} />
      </Group>

      <Card withBorder padding="xl">
        <Stack align="center" gap="xs">
          <Text
            ff="monospace"
            fw={700}
            style={{ fontSize: 'clamp(72px, 18vw, 180px)', lineHeight: 1 }}
            c={round.status === 'timeup' ? 'orange' : undefined}
          >
            {formatMmSs(remaining)}
          </Text>
          <Text c="dimmed">
            {round.status === 'pending'
              ? `Запланировано ${formatMmSs(round.durationMs)}`
              : `Из ${formatMmSs(round.durationMs)}`}
          </Text>
        </Stack>
      </Card>

      {round.status === 'timeup' && (
        <Alert color="orange" title="Время вышло">
          Руки от клавиатуры. Сохраняем файлы, открываем результаты, зал голосует.
        </Alert>
      )}

      <RoundControls round={round} />

      <RosterEditor round={round} />

      <FinalistSwap round={round} />

      {isOver && <WinnerPicker round={round} participants={participants} />}
    </Stack>
  );
}
