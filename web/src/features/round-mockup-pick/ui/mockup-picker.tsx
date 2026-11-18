import { Anchor, Group, Select, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';

import type { Round } from '@/entities/round';
import type { MockupLevel } from '@/shared/config';
import { findMockup, LEVEL_TITLES, mockupBundleUrl, MOCKUPS } from '@/shared/config';

import { MockupPickModel } from '../model/mockup-pick.model';

const LEVELS: MockupLevel[] = [1, 2, 3];

export function MockupPicker({ round }: { round: Round }) {
  const { used, onAssign } = useUnit({
    used: MockupPickModel.$usedMockupIds,
    onAssign: MockupPickModel.mockupAssigned,
  });

  const current = findMockup(round.mockupId ?? null);
  const editable = round.status === 'pending';

  // Занятые другими раундами помечаем, но не прячем: оператор вправе переиграть.
  const takenElsewhere = new Set(used.filter((id) => id !== round.mockupId));

  const groups = LEVELS.map((level) => ({
    group: LEVEL_TITLES[level],
    items: MOCKUPS.filter((mockup) => mockup.level === level).map((mockup) => ({
      value: mockup.id,
      label: takenElsewhere.has(mockup.id) ? `${mockup.title} · занят` : mockup.title,
    })),
  }));

  if (!editable) {
    if (!current) return null;

    return (
      <Group gap="xs">
        <Text c="dimmed">Макет:</Text>
        <Text fw={500}>{current.title}</Text>
        <Anchor href={mockupBundleUrl(current.id)} target="_blank" rel="noreferrer">
          открыть бандл →
        </Anchor>
      </Group>
    );
  }

  return (
    <Stack gap="xs" maw={460}>
      <Select
        label="Макет раунда"
        description="Что участники будут верстать"
        placeholder="Выбрать макет"
        clearable
        searchable
        data={groups}
        value={round.mockupId ?? null}
        onChange={(mockupId) => onAssign({ roundId: round.id, mockupId })}
      />

      {current && (
        <Anchor href={mockupBundleUrl(current.id)} target="_blank" rel="noreferrer">
          Открыть бандл участника →
        </Anchor>
      )}
    </Stack>
  );
}
