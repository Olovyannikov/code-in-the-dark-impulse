import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';

import { TournamentModel } from '@/entities/tournament';

export function BrokenStoragePage() {
  const { raw, onDiscard } = useUnit({
    raw: TournamentModel.$rawBrokenPayload,
    onDiscard: TournamentModel.brokenStorageDiscarded,
  });

  const download = () => {
    if (raw === null) return;

    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'citd-tournament-raw.json';
    // Якорь должен быть в документе, а ссылку нельзя отзывать синхронно:
    // иначе в части браузеров единственный путь спасти данные молча не сработает.
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Container size="sm" py="xl">
      <Card withBorder padding="xl">
        <Stack gap="lg">
          <Title order={2}>Сохранённый турнир не читается</Title>

          <Text>
            В памяти браузера лежат данные, которые приложение не понимает. Так бывает, если
            турнир сохраняла другая версия приложения или запись оборвалась.
          </Text>

          <Text c="dimmed" size="sm">
            Ничего не стёрто: пока ты не нажмёшь «Начать заново», данные остаются на месте и их
            можно выгрузить файлом.
          </Text>

          <Group justify="flex-end">
            <Button variant="default" disabled={raw === null} onClick={download}>
              Выгрузить файлом
            </Button>
            <Button color="red" onClick={onDiscard}>
              Начать заново
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
