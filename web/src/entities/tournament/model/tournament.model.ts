import { createEffect, createEvent, createStore, sample } from 'effector';
import type { Fail, Finally } from 'effector-storage/local';
import { persist } from 'effector-storage/local';
import { not } from 'patronum';

import type { Round } from '@/entities/round/@x/tournament';
import { createModel } from '@/shared/lib/create-model';
import { SCHEMA_VERSION } from '@/shared/config';

import { collectHeatWinners, findChampionId } from '../lib/bracket';
import type { Tournament } from './tournament.contract';
import { tournamentContract } from './tournament.contract';

export const STORAGE_KEY = 'citd-tournament';

export const EMPTY_TOURNAMENT: Tournament = {
  schemaVersion: SCHEMA_VERSION,
  participants: [],
  rounds: [],
  seededAt: null,
};

export const TournamentModel = createModel(() => {
  /** Единственная точка записи агрегата. Все фичи меняют турнир только через неё. */
  const tournamentReplaced = createEvent<Tournament>();
  const storagePickedUp = createEvent();
  const storageRestored = createEvent<Tournament>();
  const storageFailed = createEvent<Fail<Error>>();
  /** Хранилище отработало чтение: только теперь можно решать, какой экран открыть. */
  const storagePickupSettled = createEvent();
  /** Оператор выбрал начать турнир с нуля поверх повреждённых данных. */
  const brokenStorageDiscarded = createEvent();

  /**
   * При ошибке разбора JSON адаптеру нечего положить в Fail.value,
   * поэтому сырой текст читаем из хранилища сами — его оператор выгружает.
   */
  const readRawStorageFx = createEffect(() => localStorage.getItem(STORAGE_KEY));
  const tournamentPersisted = createEvent<Tournament>();
  const storageSettled = createEvent<Finally<Tournament, Error>>();

  const $tournament = createStore(EMPTY_TOURNAMENT)
    .on(tournamentReplaced, (_, next) => next)
    .on(storageRestored, (_, restored) => restored);

  const $storageBroken = createStore(false)
    .on(storageFailed, () => true)
    .reset(brokenStorageDiscarded);

  const $rawBrokenPayload = createStore<string | null>(null).on(
    readRawStorageFx.doneData,
    (_, raw) => raw,
  );

  // Производные сторы объявляются ДО persist. Если создать их после,
  // persist зафиксирует граф без них, и scope.getState начнёт отдавать
  // по ним чужие значения — поймано тестом «appStarted поднимает турнир».
  const $participants = $tournament.map((tournament) => tournament.participants);
  const $rounds = $tournament.map((tournament) => tournament.rounds);
  const $isSeeded = $tournament.map((tournament) => tournament.seededAt !== null);

  const $heats = $rounds.map((rounds) =>
    rounds.filter((round) => round.kind === 'heat').sort((a, b) => a.order - b.order),
  );
  const $finalRound = $rounds.map<Round | null>(
    (rounds) => rounds.find((round) => round.kind === 'final') ?? null,
  );
  const $heatWinnerIds = $rounds.map(collectHeatWinners);
  const $championId = $rounds.map(findChampionId);

  sample({ clock: storageFailed, target: readRawStorageFx });

  sample({
    clock: brokenStorageDiscarded,
    fn: () => EMPTY_TOURNAMENT,
    target: tournamentReplaced,
  });

  // Пока хранилище признано битым, в него не пишем: оператор ещё может выгрузить сырые данные.
  sample({
    clock: $tournament,
    filter: not($storageBroken),
    target: tournamentPersisted,
  });

  persist({
    source: tournamentPersisted,
    target: storageRestored,
    key: STORAGE_KEY,
    contract: tournamentContract,
    pickup: storagePickedUp,
    fail: storageFailed,
    finally: storageSettled,
    sync: true,
  });

  sample({
    clock: storageSettled,
    filter: ({ operation }) => operation === 'get',
    target: storagePickupSettled,
  });

  return {
    tournamentReplaced,
    storagePickedUp,
    storagePickupSettled,
    brokenStorageDiscarded,
    $tournament,
    $storageBroken,
    $rawBrokenPayload,
    $participants,
    $rounds,
    $heats,
    $finalRound,
    $heatWinnerIds,
    $championId,
    $isSeeded,
  };
});
