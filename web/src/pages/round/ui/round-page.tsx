import { Container, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';

import { routes } from '@/shared/routes';
import { RoundRunner } from '@/widgets/round-runner';

export function RoundPage() {
  const onOpenBracket = useUnit(routes.bracket.open);

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Text style={{ cursor: 'pointer' }} c="dimmed" onClick={() => onOpenBracket()}>
          ← К сетке
        </Text>

        <RoundRunner />
      </Stack>
    </Container>
  );
}
