import { Button, Group, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';

import type { Participant } from '@/entities/participant';
import type { Round } from '@/entities/round';

import { WinnerPickModel } from '../model/winner.model';

type Props = {
  round: Round;
  participants: Participant[];
};

export function WinnerPicker({ round, participants }: Props) {
  const { onPick, onReopen } = useUnit({
    onPick: WinnerPickModel.winnerPicked,
    onReopen: WinnerPickModel.roundReopened,
  });

  const roster = participants.filter((person) => round.participantIds.includes(person.id));

  return (
    <Stack gap="sm">
      <Text fw={500}>
        {round.status === 'finished' ? 'Победитель раунда' : 'Кого выбрал зал?'}
      </Text>

      <Group>
        {roster.map((person, index) => (
          <Button
            key={person.id}
            size="md"
            variant={round.winnerId === person.id ? 'filled' : 'default'}
            onClick={() => onPick({ roundId: round.id, winnerId: person.id })}
          >
            {index + 1} · {person.name}
          </Button>
        ))}
      </Group>

      {round.status === 'finished' && (
        <Group>
          <Button variant="subtle" color="red" onClick={() => onReopen(round.id)}>
            Переиграть раунд
          </Button>
        </Group>
      )}
    </Stack>
  );
}
