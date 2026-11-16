import { ActionIcon, Button, Group, Select, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useState } from 'react';

import type { Round } from '@/entities/round';
import { TournamentModel } from '@/entities/tournament';

import { RosterModel } from '../model/roster.model';

type Props = { round: Round };

export function RosterEditor({ round }: Props) {
  const { participants, heats, onMove, onRemove, onAdd } = useUnit({
    participants: TournamentModel.$participants,
    heats: TournamentModel.$heats,
    onMove: RosterModel.rosterParticipantMoved,
    onRemove: RosterModel.rosterParticipantRemoved,
    onAdd: RosterModel.rosterParticipantAdded,
  });

  const [latecomer, setLatecomer] = useState<string | null>(null);

  if (round.status !== 'pending') return null;

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? '—';

  const seated = new Set(heats.flatMap((heat) => heat.participantIds));
  const unseated = participants.filter((person) => !seated.has(person.id));
  const otherHeats = heats.filter((heat) => heat.id !== round.id && heat.status === 'pending');

  return (
    <Stack gap="sm">
      <Text fw={500}>Состав</Text>

      {round.participantIds.map((id) => (
        <Group key={id} gap="xs">
          <Text style={{ flex: 1 }}>{nameOf(id)}</Text>

          {otherHeats.length > 0 && (
            <Select
              size="xs"
              w={190}
              placeholder="Перенести в…"
              value={null}
              data={otherHeats.map((heat) => ({
                value: heat.id,
                label: `Отбор ${heat.order + 1}`,
              }))}
              onChange={(toRoundId) => toRoundId && onMove({ participantId: id, toRoundId })}
            />
          )}

          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={`Убрать ${nameOf(id)} из раунда`}
            onClick={() => onRemove({ participantId: id, roundId: round.id })}
          >
            ✕
          </ActionIcon>
        </Group>
      ))}

      {unseated.length > 0 && (
        <Group gap="xs" align="flex-end">
          <Select
            size="xs"
            w={220}
            label="Опоздавший"
            placeholder="Кого посадить"
            value={latecomer}
            data={unseated.map((person) => ({ value: person.id, label: person.name }))}
            onChange={setLatecomer}
          />
          <Button
            size="xs"
            variant="default"
            disabled={latecomer === null}
            onClick={() => {
              if (latecomer) onAdd({ participantId: latecomer, roundId: round.id });
              setLatecomer(null);
            }}
          >
            Добавить в раунд
          </Button>
        </Group>
      )}
    </Stack>
  );
}
