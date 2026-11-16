import { Button, Group } from '@mantine/core';
import { useUnit } from 'effector-react';
import { match } from 'ts-pattern';

import type { Round } from '@/entities/round';

import { RoundRunModel } from '../model/round-run.model';

type Props = { round: Round };

const MINUTE = 60_000;

export function RoundControls({ round }: Props) {
  const { onStart, onPause, onResume, onStop, onExtend } = useUnit({
    onStart: RoundRunModel.roundStarted,
    onPause: RoundRunModel.roundPaused,
    onResume: RoundRunModel.roundResumed,
    onStop: RoundRunModel.roundStoppedEarly,
    onExtend: RoundRunModel.roundTimeExtended,
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
    <Group>
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
