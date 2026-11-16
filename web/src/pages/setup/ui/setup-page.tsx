import { Container, Stack, Title } from '@mantine/core';

export function SetupPage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Title order={1}>Участники</Title>
      </Stack>
    </Container>
  );
}
