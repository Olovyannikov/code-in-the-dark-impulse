import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';

import { ResetModel } from '../model/reset.model';

export function ResetTournament() {
  const { open, onRequest, onConfirm, onCancel } = useUnit({
    open: ResetModel.$confirmOpen,
    onRequest: ResetModel.tournamentResetRequested,
    onConfirm: ResetModel.tournamentResetConfirmed,
    onCancel: ResetModel.tournamentResetCancelled,
  });

  return (
    <>
      <Button variant="subtle" color="red" onClick={onRequest}>
        Сбросить турнир
      </Button>

      <Modal opened={open} onClose={onCancel} title="Сбросить турнир?">
        <Stack>
          <Text>
            Удалятся участники, сетка и все результаты. Отменить это будет нельзя.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={onCancel}>
              Отмена
            </Button>
            <Button color="red" onClick={onConfirm}>
              Сбросить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
