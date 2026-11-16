import { ActionIcon, Button, Group, Stack, Table, Text, Textarea, TextInput } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useState } from 'react';

import { TournamentModel } from '@/entities/tournament';

import { ParticipantsModel } from '../model/participants.model';

export function ParticipantsEditor() {
  const { participants, onAdd, onPaste, onRemove, onRename } = useUnit({
    participants: TournamentModel.$participants,
    onAdd: ParticipantsModel.participantAdded,
    onPaste: ParticipantsModel.participantsPasted,
    onRemove: ParticipantsModel.participantRemoved,
    onRename: ParticipantsModel.participantRenamed,
  });

  const [draft, setDraft] = useState('');
  const [bulk, setBulk] = useState('');

  const submitDraft = () => {
    onAdd(draft);
    setDraft('');
  };

  const submitBulk = () => {
    onPaste(bulk);
    setBulk('');
  };

  return (
    <Stack gap="lg">
      <Group align="flex-end">
        <TextInput
          label="Имя участника"
          placeholder="Аня"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => event.key === 'Enter' && submitDraft()}
          style={{ flex: 1 }}
        />
        <Button onClick={submitDraft}>Добавить</Button>
      </Group>

      <Stack gap="xs">
        <Textarea
          label="Или вставить списком"
          description="По одному имени в строке. Нумерация и маркеры списка снимаются сами."
          minRows={3}
          autosize
          value={bulk}
          onChange={(event) => setBulk(event.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={submitBulk}>
            Добавить списком
          </Button>
        </Group>
      </Stack>

      {participants.length === 0 ? (
        <Text c="dimmed">Пока никого. Добавь участников, чтобы провести жеребьёвку.</Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={60}>№</Table.Th>
              <Table.Th>Имя</Table.Th>
              <Table.Th w={60} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {participants.map((person, index) => (
              <Table.Tr key={person.id}>
                <Table.Td>{index + 1}</Table.Td>
                <Table.Td>
                  <TextInput
                    variant="unstyled"
                    value={person.name}
                    onChange={(event) =>
                      onRename({ id: person.id, name: event.currentTarget.value })
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Удалить ${person.name}`}
                    onClick={() => onRemove(person.id)}
                  >
                    ✕
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
