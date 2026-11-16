import { Container, Stack, Title } from '@mantine/core';

export function ResultsPage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Title order={1}>Итоги</Title>
      </Stack>
    </Container>
  );
}
