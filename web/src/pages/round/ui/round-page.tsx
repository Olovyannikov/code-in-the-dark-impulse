import { Button, Container, Group, Stack } from '@mantine/core';
import { useUnit } from 'effector-react';

import { routes } from '@/shared/routes';
import { RoundRunner } from '@/widgets/round-runner';

export function RoundPage() {
  const onOpenBracket = useUnit(routes.bracket.open);

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group>
          <Button variant="subtle" color="gray" px={0} onClick={() => onOpenBracket()}>
            ← К сетке
          </Button>
        </Group>

        <RoundRunner />
      </Stack>
    </Container>
  );
}
