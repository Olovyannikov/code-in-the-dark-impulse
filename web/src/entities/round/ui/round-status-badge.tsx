import { Badge } from '@mantine/core';
import { match } from 'ts-pattern';

import type { RoundStatus } from '../model/round.contract';

export function RoundStatusBadge({ status }: { status: RoundStatus }) {
  const { label, color } = match(status)
    .with('pending', () => ({ label: 'Не начат', color: 'gray' }))
    .with('running', () => ({ label: 'Идёт', color: 'impulse' }))
    .with('paused', () => ({ label: 'Пауза', color: 'yellow' }))
    .with('timeup', () => ({ label: 'Время вышло', color: 'orange' }))
    .with('finished', () => ({ label: 'Завершён', color: 'green' }))
    .exhaustive();

  return <Badge color={color} variant="light">{label}</Badge>;
}
