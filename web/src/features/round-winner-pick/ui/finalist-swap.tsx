import { Button, Group, Select, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useState } from 'react';

import type { Round } from '@/entities/round';
import { TournamentModel } from '@/entities/tournament';

import { WinnerPickModel } from '../model/winner.model';

type Props = { round: Round };

/** Победитель отбора отказался от финала — сажаем вместо него другого. */
export function FinalistSwap({ round }: Props) {
  const { participants, onReplace } = useUnit({
    participants: TournamentModel.$participants,
    onReplace: WinnerPickModel.finalistReplaced,
  });

  const [outId, setOutId] = useState<string | null>(null);
  const [inId, setInId] = useState<string | null>(null);

  if (round.kind !== 'final' || round.status !== 'pending') return null;

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? '—';
  const outside = participants.filter((person) => !round.participantIds.includes(person.id));

  if (outside.length === 0) return null;

  return (
    <Stack gap="xs">
      <Text fw={500}>Замена финалиста</Text>
      <Group gap="xs" align="flex-end">
        <Select
          size="xs"
          w={200}
          label="Кто отказался"
          placeholder="Финалист"
          value={outId}
          data={round.participantIds.map((id) => ({ value: id, label: nameOf(id) }))}
          onChange={setOutId}
        />
        <Select
          size="xs"
          w={200}
          label="Кто вместо него"
          placeholder="Участник"
          value={inId}
          data={outside.map((person) => ({ value: person.id, label: person.name }))}
          onChange={setInId}
        />
        <Button
          size="xs"
          variant="default"
          disabled={outId === null || inId === null}
          onClick={() => {
            if (outId && inId) onReplace({ outId, inId });
            setOutId(null);
            setInId(null);
          }}
        >
          Заменить
        </Button>
      </Group>
    </Stack>
  );
}
