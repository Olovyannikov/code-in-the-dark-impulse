import { Button, Group, NumberInput } from '@mantine/core';
import { useUnit } from 'effector-react';
import { match } from 'ts-pattern';

import type { Round } from '@/entities/round';

import { RoundRunModel } from '../model/round-run.model';

type Props = { round: Round };

const MINUTE = 60_000;

export function RoundControls({ round }: Props) {
  const { onStart, onPause, onResume, onStop, onExtend, onDuration } = useUnit({
    onStart: RoundRunModel.roundStarted,
    onPause: RoundRunModel.roundPaused,
    onResume: RoundRunModel.roundResumed,
    onStop: RoundRunModel.roundStoppedEarly,
    onExtend: RoundRunModel.roundTimeExtended,
    onDuration: RoundRunModel.roundDurationChanged,
  });

  const primary = match(round.status)
    .with('pending', () => (
      <Button size="lg" onClick={() => onStart(round.id)}>
        Старт
      </Button>
    ))
    .with('running', () => (
      <Button size="lg" variant="default" onClick={() => onPause(round.id)}>
        Пауза
      </Button>
    ))
    .with('paused', () => (
      <Button size="lg" onClick={() => onResume(round.id)}>
        Продолжить
      </Button>
    ))
    .with('timeup', 'finished', () => null)
    .exhaustive();

  const isLive = round.status === 'running' || round.status === 'paused';

  return (
    <Group align="flex-end" gap="sm">
      {/* Регламент разрешает резать отборы до старта — например до 8 минут. */}
      {round.status === 'pending' && (
        <NumberInput
          label="Минут на раунд"
          size="lg"
          w={160}
          min={1}
          max={60}
          value={Math.round(round.durationMs / MINUTE)}
          onChange={(value) => {
            const minutes = Number(value);
            if (Number.isFinite(minutes) && minutes > 0) {
              onDuration({ roundId: round.id, durationMs: minutes * MINUTE });
            }
          }}
        />
      )}
      {primary}
      {isLive && (
        <Button size="lg" color="red" variant="light" onClick={() => onStop(round.id)}>
          Стоп
        </Button>
      )}
      {isLive && (
        <>
          <Button
            variant="subtle"
            onClick={() => onExtend({ roundId: round.id, deltaMs: MINUTE })}
          >
            +1 мин
          </Button>
          <Button
            variant="subtle"
            onClick={() => onExtend({ roundId: round.id, deltaMs: 2 * MINUTE })}
          >
            +2 мин
          </Button>
        </>
      )}
    </Group>
  );
}
