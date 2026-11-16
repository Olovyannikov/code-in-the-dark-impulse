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
      <Group justify="space-between" align="center" wrap="nowrap">
        <Title order={2}>{round.kind === 'final' ? 'Финал' : `Отбор ${round.order + 1}`}</Title>
        <RoundStatusBadge status={round.status} />
      </Group>

      <Card
        padding="xl"
        radius="sm"
        bg="#0b0b0b"
        style={{ border: '1px solid #262626' }}
      >
        <Stack align="center" gap={4}>
          <Text
            className="tnum"
            fw={500}
            style={{ fontSize: 'clamp(72px, 16vw, 168px)', lineHeight: 1, letterSpacing: '-0.04em' }}
            c={round.status === 'timeup' ? 'orange' : undefined}
          >
            {formatMmSs(remaining)}
          </Text>
          <Text c="dimmed" className="tnum">
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
