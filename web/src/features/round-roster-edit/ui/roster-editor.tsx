import { ActionIcon, Autocomplete, Button, Group, Select, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useState } from 'react';

import type { Round } from '@/entities/round';
import { TournamentModel } from '@/entities/tournament';
import { CrossIcon } from '@/shared/ui';

import { RosterModel } from '../model/roster.model';

type Props = { round: Round };

export function RosterEditor({ round }: Props) {
  const { participants, heats, onMove, onRemove, onAddLatecomer } = useUnit({
    participants: TournamentModel.$participants,
    heats: TournamentModel.$heats,
    onMove: RosterModel.rosterParticipantMoved,
    onRemove: RosterModel.rosterParticipantRemoved,
    onAddLatecomer: RosterModel.latecomerAdded,
  });

  const [latecomer, setLatecomer] = useState('');

  if (round.status !== 'pending') return null;

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? '—';

  const seated = new Set(heats.flatMap((heat) => heat.participantIds));
  const unseated = participants.filter((person) => !seated.has(person.id));
  const otherHeats = heats.filter((heat) => heat.id !== round.id && heat.status === 'pending');

  const typed = latecomer.trim().replace(/\s+/g, ' ');
  const isKnown = unseated.some((person) => person.name === typed);

  const submit = () => {
    if (typed.length === 0) return;
    onAddLatecomer({ roundId: round.id, name: typed });
    setLatecomer('');
  };

  return (
    <Stack gap="sm" maw={460}>
      <Text fw={500}>Состав</Text>

      {round.participantIds.map((id, index) => (
        <Group key={id} gap="sm" wrap="nowrap">
          <Text c="dimmed" w={20} className="tnum">
            {index + 1}
          </Text>
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
            <CrossIcon />
          </ActionIcon>
        </Group>
      ))}

      <Group gap="sm" align="flex-end" wrap="nowrap" mt="sm">
        <Autocomplete
          label="Посадить в раунд"
          description="Можно выбрать из списка или вписать нового человека"
          placeholder="Имя"
          style={{ flex: 1 }}
          value={latecomer}
          data={unseated.map((person) => person.name)}
          onChange={setLatecomer}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
        />
        <Button variant="default" disabled={latecomer.trim().length === 0} onClick={submit}>
          {typed.length === 0 || isKnown ? 'Посадить' : 'Создать и посадить'}
        </Button>
      </Group>
    </Stack>
  );
}
