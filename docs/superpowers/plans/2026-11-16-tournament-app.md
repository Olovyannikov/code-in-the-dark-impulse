# Приложение турнирной сетки — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Инструмент оператора, который ведёт турнир code-in-the-dark: жеребьёвка, сетка, раунд с таймером, победители, чемпион.

**Architecture:** SPA без бэкенда. Единственный источник правды — стор `$tournament` в `entities/tournament`, синхронизированный с localStorage через `effector-storage/local` с контрактом. Все пользовательские действия — фичи, которые шлют события в агрегат. UI читает только производные сторы.

**Tech Stack:** Vite, React 19, TypeScript, Mantine 9, Effector 23, effector-react, patronum, effector-action, effector-storage, @withease/contracts, atomic-router, Vitest, eslint-plugin-effector, Steiger.

**Spec:** `docs/superpowers/specs/2026-11-16-tournament-app-design.md`

## Global Constraints

- Приложение работает офлайн, сетевых запросов нет. `effector-refetch`, Farfetched и любые HTTP-клиенты в зависимости не добавляются
- Хранилище — только `localStorage` через `effector-storage/local`, с включённой синхронизацией между вкладками. IndexedDB не используется
- `schemaVersion` в сохраняемых данных — целое число, текущее значение `1`
- Длительности по умолчанию: отбор `10 * 60 * 1000`, финал `15 * 60 * 1000`
- Размер отбора — 4. Минимум участников в отборе — 2. Максимум отборов — 5
- Единицы Effector создаются только на уровне модуля. В React-компонентах — один вызов `useUnit` с объектной формой на компонент
- Производные сторы не бывают целями `sample`
- Все импорты между слайсами — только через публичный `index.ts`
- Остаток времени всегда вычисляется из `deadlineAt - Date.now()`, никогда накоплением
- Язык интерфейса — русский

## Review Focus

- **`Date.now()` уходит назад** (ноутбук менял время, синхронизация NTP): остаток не должен становиться больше исходной длительности — пин в Task 6
- **Ноутбук спал во время раунда**: при пробуждении `deadlineAt` уже в прошлом, раунд обязан оказаться в `timeup` с остатком `0`, а не в отрицательном отсчёте — пин в Task 6
- **Одинаковые имена участников**: два «Саши» — это два разных человека; вся идентификация по `id`, имя не уникально — пин в Task 3
- **Мусор при вставке списком**: пустые строки, повторные пробелы, нумерация вида `1. Имя` и `- Имя` — пин в Task 8
- **Смена победителя отбора после сыгранного финала**: финал пересобирается, его `winnerId` сбрасывается, чемпион исчезает — пин в Task 7

---

### Task 1: Каркас проекта

**Files:**
- Create: `app/` (Vite-проект в подпапке репозитория), `app/package.json`, `app/vite.config.ts`, `app/tsconfig.json`, `app/eslint.config.js`, `app/steiger.config.ts`, `app/src/app/entrypoint/main.tsx`, `app/src/app/providers/app-provider.tsx`, `app/src/app/model/app.model.ts`
- Test: `app/src/app/model/app.model.test.ts`

**Interfaces:**
- Produces: `appStarted: Event<void>` из `@/app/model/app.model`; алиас `@/*` → `src/*`

- [ ] **Step 1: Создать Vite-проект и поставить зависимости**

```bash
npm create vite@latest app -- --template react-ts
cd app
npm i effector effector-react patronum effector-action effector-storage @withease/contracts atomic-router @mantine/core @mantine/hooks
npm i -D vitest @testing-library/react jsdom eslint-plugin-effector steiger @feature-sliced/steiger-plugin
```

- [ ] **Step 2: Настроить `vite.config.ts`**

Алиас `@` → `./src`. Плагин React с `babel: { plugins: ['effector/babel-plugin'] }` — без него у юнитов не будет стабильных SID и тесты через `fork` станут хрупкими. Блок `test` с `environment: 'jsdom'`, `globals: true`.

- [ ] **Step 3: Написать падающий тест старта**

```ts
test('appStarted запускается в изолированном скоупе', async () => {
  const scope = fork();
  await allSettled(appStarted, { scope });
  expect(scope.getState($isAppReady)).toBe(true);
});
```

- [ ] **Step 4: Убедиться, что тест падает**

Run: `npm test -- app.model`
Expected: FAIL — модуль не найден

- [ ] **Step 5: Реализовать `app.model.ts`**

Экспортирует `appStarted: Event<void>` и `$isAppReady: Store<boolean>`. Больше пока ничего: подъём хранилища и роутер подключаются в Task 4 и Task 9 через `sample` от `appStarted`.

- [ ] **Step 6: Реализовать `main.tsx` и `app-provider.tsx`**

`main.tsx` создаёт `const scope = fork()`, вызывает `allSettled(appStarted, { scope })`, рендерит `<Provider value={scope}>`. `app-provider.tsx` оборачивает дерево в `MantineProvider` с тёмной темой.

- [ ] **Step 7: Настроить линтеры**

`eslint.config.js` с пресетами `effector/recommended`, `effector/react`, `effector/scope`, `effector/patronum`. `steiger.config.ts` с пресетом `fsd/recommended`.

- [ ] **Step 8: Проверить сборку и тесты**

Run: `npm run build && npm test && npx eslint . && npx steiger src`
Expected: всё зелёное

- [ ] **Step 9: Commit**

```bash
git add app && git commit -m "Каркас: Vite, Mantine, Effector, тесты, линтеры"
```

---

### Task 2: Доменные типы, контракты и конфигурация

**Files:**
- Create: `app/src/shared/config/tournament.ts`, `app/src/entities/participant/model/participant.contract.ts`, `app/src/entities/participant/index.ts`, `app/src/entities/round/model/round.contract.ts`, `app/src/entities/round/index.ts`, `app/src/entities/tournament/model/tournament.contract.ts`, `app/src/entities/tournament/index.ts`
- Test: `app/src/entities/tournament/model/tournament.contract.test.ts`

**Interfaces:**
- Produces: типы `Participant`, `Round`, `RoundKind`, `RoundStatus`, `Tournament` ровно в формах из спеки; контракты `participantContract`, `roundContract`, `tournamentContract`; константы `HEAT_SIZE = 4`, `MIN_HEAT_SIZE = 2`, `MAX_HEATS = 5`, `HEAT_DURATION_MS`, `FINAL_DURATION_MS`, `SCHEMA_VERSION = 1`

- [ ] **Step 1: Написать падающие тесты контракта**

```ts
test('валидный турнир проходит контракт', () => { ... });
test('турнир с чужой schemaVersion не проходит', () => { ... });
test('раунд с неизвестным status не проходит', () => { ... });
test('раунд, где winnerId не из participantIds, не проходит', () => { ... });
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `npm test -- tournament.contract`

- [ ] **Step 3: Реализовать типы и контракты через `@withease/contracts`**

`tournamentContract` проверяет и ссылочную целостность: каждый `participantIds[]` и `winnerId` ссылается на существующего участника. Это единственное место, где такая проверка есть, — дальше код полагается на неё.

- [ ] **Step 4: Прогнать тесты**

Expected: PASS

- [ ] **Step 5: Commit**

---

### Task 3: Чистая логика сетки

**Files:**
- Create: `app/src/shared/lib/shuffle/shuffle.ts`, `app/src/shared/lib/shuffle/index.ts`, `app/src/entities/tournament/lib/seed.ts`, `app/src/entities/tournament/lib/bracket.ts`
- Test: `app/src/shared/lib/shuffle/shuffle.test.ts`, `app/src/entities/tournament/lib/seed.test.ts`, `app/src/entities/tournament/lib/bracket.test.ts`

**Interfaces:**
- Consumes: типы и константы из Task 2
- Produces:
  - `shuffle<T>(items: readonly T[], random?: () => number): T[]`
  - `splitIntoHeats(participants: readonly Participant[]): Participant[][]`
  - `canSeed(count: number): { ok: true } | { ok: false; reason: string }`
  - `collectHeatWinners(rounds: readonly Round[]): string[]`
  - `findChampionId(rounds: readonly Round[]): string | null`

- [ ] **Step 1: Написать падающие тесты**

```ts
// shuffle
test('с подменённым random результат детерминирован', ...);
test('возвращает перестановку, не теряя и не дублируя элементы', ...);
test('не мутирует исходный массив', ...);

// seed — распределение РАВНОМЕРНОЕ, это главное правило
test('16 участников дают отборы 4/4/4/4', ...);
test('14 участников дают отборы 4/4/3/3, а не 4/4/4/2', ...);
test('5 участников дают отборы 3/2', ...);
test('двое участников с одинаковым именем остаются двумя записями', ...);
test('canSeed отвергает 4 и меньше', ...);
test('canSeed отвергает 21 и больше', ...);

// bracket
test('collectHeatWinners возвращает победителей в порядке order отборов', ...);
test('collectHeatWinners пропускает незавершённые отборы', ...);
test('findChampionId возвращает null, пока финал не сыгран', ...);
```

- [ ] **Step 2: Убедиться, что тесты падают**

- [ ] **Step 3: Реализовать `shuffle`**

Фишер — Йетс с инъекцией источника случайности. Дефолт — `Math.random`.

- [ ] **Step 4: Реализовать `splitIntoHeats` и `canSeed`**

Число отборов — `ceil(N / HEAT_SIZE)`. Остаток распределяется так, чтобы размеры отличались не больше чем на единицу: первые `N % heats` отборов получают на одного больше. `canSeed` возвращает человекочитаемую причину по-русски — она показывается оператору.

- [ ] **Step 5: Реализовать `bracket.ts`**

- [ ] **Step 6: Прогнать тесты и закоммитить**

---

### Task 4: Агрегат турнира и персист

**Files:**
- Create: `app/src/entities/tournament/model/tournament.model.ts`, `app/src/entities/tournament/model/tournament.persist.ts`
- Modify: `app/src/entities/tournament/index.ts`, `app/src/app/model/app.model.ts`
- Test: `app/src/entities/tournament/model/tournament.persist.test.ts`

**Interfaces:**
- Produces:
  - `$tournament: Store<Tournament>`, `EMPTY_TOURNAMENT: Tournament`
  - `tournamentReplaced: Event<Tournament>` — единственная точка записи всего агрегата
  - `$storageBroken: Store<boolean>`, `$rawBrokenPayload: Store<string | null>`
  - производные: `$participants`, `$rounds`, `$heats`, `$finalRound`, `$championId`, `$isSeeded`
  - `storagePickedUp: Event<void>`

- [ ] **Step 1: Написать падающие тесты**

```ts
test('валидные данные из localStorage попадают в $tournament', ...);
test('битый JSON поднимает $storageBroken и сохраняет сырой текст', ...);
test('чужая schemaVersion поднимает $storageBroken, не затирая localStorage', ...);
test('пустое хранилище даёт EMPTY_TOURNAMENT без $storageBroken', ...);
```

- [ ] **Step 2: Убедиться, что тесты падают**

- [ ] **Step 3: Реализовать `tournament.model.ts`**

`$tournament` с `EMPTY_TOURNAMENT` и `.on(tournamentReplaced, (_, next) => next)`. Производные — через `.map` и `combine`, с вынесением нетривиальных преобразований в `lib/bracket.ts` из Task 3.

- [ ] **Step 4: Реализовать `tournament.persist.ts`**

`persist` из `effector-storage/local` на `$tournament`, ключ `citd-tournament`, `contract: tournamentContract`, `sync: true`. Провал контракта ловится через `.fail` и поднимает `$storageBroken`.

Важно: при провале контракта запись в localStorage не производится, иначе оператор потеряет данные, которые ещё можно выгрузить.

- [ ] **Step 5: Подключить подъём хранилища к `appStarted`**

`pickup` вызывается из `sample({ clock: appStarted, target: storagePickedUp })`, а не на уровне модуля — иначе в тестах со скоупом состояние потечёт между кейсами.

- [ ] **Step 6: Прогнать тесты и закоммитить**

---

### Task 5: Жеребьёвка

**Files:**
- Create: `app/src/features/tournament-seed/model/seed.model.ts`, `app/src/features/tournament-seed/ui/seed-button.tsx`, `app/src/features/tournament-seed/index.ts`
- Test: `app/src/features/tournament-seed/model/seed.model.test.ts`

**Interfaces:**
- Consumes: `$participants`, `tournamentReplaced`, `splitIntoHeats`, `canSeed`
- Produces: `seedRequested: Event<void>`, `$canSeed: Store<boolean>`, `$seedBlockReason: Store<string | null>`, `$$seed` — объектная форма для `useUnit`

- [ ] **Step 1: Написать падающие тесты**

```ts
test('жеребьёвка создаёт отборы по splitIntoHeats со статусом pending', ...);
test('каждому отбору проставлена длительность HEAT_DURATION_MS и order по порядку', ...);
test('финал при жеребьёвке не создаётся', ...);
test('повторная жеребьёвка пересоздаёт отборы с нуля', ...);
test('при 4 участниках seedRequested не меняет турнир, $seedBlockReason заполнен', ...);
```

- [ ] **Step 2–4: Реализовать модель, прогнать тесты**

Сборка нового `Tournament` — именованная чистая функция `buildSeededTournament(participants, heats)` в `features/tournament-seed/lib`, а не инлайн в `sample.fn`.

- [ ] **Step 5: Реализовать `seed-button.tsx`**

Кнопка Mantine, `disabled` по `$canSeed`, с `Tooltip` из `$seedBlockReason`.

- [ ] **Step 6: Commit**

---

### Task 6: Таймер раунда

**Files:**
- Create: `app/src/features/round-run/model/round-run.model.ts`, `app/src/features/round-run/lib/timer.ts`, `app/src/features/round-run/ui/round-controls.tsx`, `app/src/features/round-run/index.ts`
- Test: `app/src/features/round-run/lib/timer.test.ts`, `app/src/features/round-run/model/round-run.model.test.ts`

**Interfaces:**
- Produces:
  - `remainingMsAt(round: Round, now: number): number` — чистая, без `Date.now()` внутри
  - события `roundStarted: Event<string>`, `roundPaused`, `roundResumed`, `roundStoppedEarly`, `roundTimeExtended: Event<{ roundId: string; deltaMs: number }>`, `roundDurationChanged: Event<{ roundId: string; durationMs: number }>`
  - `$tick: Store<number>` — отметка времени для перерисовки
  - `$$roundRun` — объектная форма для `useUnit`

- [ ] **Step 1: Написать падающие тесты чистой арифметики**

```ts
test('running: остаток считается как deadlineAt - now', ...);
test('paused: остаток берётся из remainingMs и не зависит от now', ...);
test('deadlineAt в прошлом даёт ровно 0, а не отрицательное число', ...);
test('now ушёл назад: остаток не превышает durationMs', ...);
test('pending: остаток равен durationMs', ...);
```

- [ ] **Step 2: Написать падающие тесты модели**

```ts
test('старт проставляет status running и deadlineAt = now + durationMs', ...);
test('пауза превращает deadlineAt в remainingMs и обнуляет deadlineAt', ...);
test('снятие паузы восстанавливает deadlineAt из remainingMs', ...);
test('+2 минуты во время бега сдвигают deadlineAt, не трогая durationMs', ...);
test('+2 минуты на паузе увеличивают remainingMs', ...);
test('тик при истёкшем deadlineAt переводит раунд в timeup с remainingMs 0', ...);
test('ноутбук спал: один тик спустя час даёт timeup, а не отрицательный отсчёт', ...);
test('правка длительности разрешена только в pending', ...);
test('повторный старт running-раунда ничего не меняет', ...);
```

- [ ] **Step 3: Убедиться, что тесты падают**

- [ ] **Step 4: Реализовать `timer.ts`**

- [ ] **Step 5: Реализовать `round-run.model.ts`**

Тик — `interval` из `patronum` с шагом 1000 мс, запускается, когда есть раунд в статусе `running`, и останавливается иначе. Переход в `timeup` — следствие тика, а не отдельного таймера на истечение: один источник времени надёжнее двух.

Ветвление по текущему статусу раунда — через `effector-action`: переходов пять, и цепочка `sample` здесь читается хуже.

- [ ] **Step 6: Реализовать `round-controls.tsx`**

Кнопки «Старт», «Пауза», «Продолжить», «Стоп», «+1 мин», «+2 мин» — доступность по статусу раунда.

- [ ] **Step 7: Прогнать тесты и закоммитить**

---

### Task 7: Победитель раунда и пересборка финала

**Files:**
- Create: `app/src/features/round-winner-pick/model/winner.model.ts`, `app/src/features/round-winner-pick/lib/rebuild-final.ts`, `app/src/features/round-winner-pick/ui/winner-picker.tsx`, `app/src/features/round-winner-pick/index.ts`
- Test: `app/src/features/round-winner-pick/lib/rebuild-final.test.ts`, `app/src/features/round-winner-pick/model/winner.model.test.ts`

**Interfaces:**
- Produces:
  - `rebuildFinal(tournament: Tournament): Tournament`
  - `winnerPicked: Event<{ roundId: string; winnerId: string }>`, `roundReopened: Event<string>`, `finalistReplaced: Event<{ outId: string; inId: string }>`
  - `$$winnerPick`

- [ ] **Step 1: Написать падающие тесты**

```ts
test('отметка победителя переводит раунд в finished', ...);
test('последний завершённый отбор создаёт финал из победителей по порядку отборов', ...);
test('финал получает FINAL_DURATION_MS и kind final', ...);
test('финал не создаётся, пока хотя бы один отбор не завершён', ...);
test('смена победителя отбора пересобирает состав финала', ...);
test('смена победителя отбора после сыгранного финала сбрасывает winnerId финала и чемпиона', ...);
test('roundReopened возвращает раунд в pending, снимает winnerId и убирает финал', ...);
test('finalistReplaced подменяет финалиста, не трогая отборы', ...);
test('завершить раунд без победителя нельзя', ...);
```

- [ ] **Step 2: Убедиться, что падают**

- [ ] **Step 3: Реализовать `rebuild-final.ts`**

Чистая функция: принимает турнир, возвращает турнир с корректным финалом. Вся логика «когда финал существует и из кого состоит» живёт здесь и больше нигде.

- [ ] **Step 4: Реализовать модель поверх неё**

- [ ] **Step 5: Прогнать тесты и закоммитить**

---

### Task 8: Участники, составы и сброс

**Files:**
- Create: `app/src/features/participants-manage/{model,lib,ui,index.ts}`, `app/src/features/round-roster-edit/{model,ui,index.ts}`, `app/src/features/tournament-reset/{model,ui,index.ts}`
- Test: `app/src/features/participants-manage/lib/parse-names.test.ts`, `app/src/features/participants-manage/model/participants.model.test.ts`, `app/src/features/round-roster-edit/model/roster.model.test.ts`

**Interfaces:**
- Produces:
  - `parseNames(input: string): string[]`
  - `participantAdded: Event<string>`, `participantRemoved: Event<string>`, `participantRenamed: Event<{ id: string; name: string }>`, `participantsPasted: Event<string>`
  - `rosterParticipantMoved: Event<{ participantId: string; toRoundId: string }>`, `rosterParticipantRemoved: Event<{ participantId: string; roundId: string }>`
  - `tournamentResetRequested`, `tournamentResetConfirmed`

- [ ] **Step 1: Написать падающие тесты разбора списка**

```ts
test('разбивает по переводам строки', ...);
test('выкидывает пустые строки и схлопывает пробелы', ...);
test('снимает нумерацию вида "1. Имя" и "1) Имя"', ...);
test('снимает маркеры списка "- Имя" и "• Имя"', ...);
test('сохраняет два одинаковых имени как две записи', ...);
```

- [ ] **Step 2: Написать падающие тесты моделей**

```ts
test('удаление участника убирает его из составов раундов', ...);
test('удаление участника, который уже победил в раунде, снимает winnerId', ...);
test('перенос участника между отборами не ломает размеры', ...);
test('перенос запрещён в отбор со статусом running', ...);
test('сброс требует подтверждения и возвращает EMPTY_TOURNAMENT', ...);
```

- [ ] **Step 3–5: Реализовать, прогнать тесты, закоммитить**

---

### Task 9: Роутинг и каркас страниц

**Files:**
- Create: `app/src/shared/routes/index.ts`, `app/src/app/routes/router.ts`, `app/src/pages/{setup,bracket,round,results}/{index.ts,route.ts,ui/*.tsx}`, `app/src/app/providers/router-provider.tsx`
- Modify: `app/src/app/model/app.model.ts`
- Test: `app/src/app/routes/router.test.ts`

**Interfaces:**
- Produces: `routes.setup`, `routes.bracket`, `routes.round` (параметр `roundId`), `routes.results`

- [ ] **Step 1: Написать падающий тест стартовой навигации**

```ts
test('без жеребьёвки appStarted открывает setup', ...);
test('с готовой сеткой и без чемпиона appStarted открывает bracket', ...);
test('с определившимся чемпионом appStarted открывает results', ...);
```

- [ ] **Step 2: Убедиться, что падает**

- [ ] **Step 3: Реализовать роуты и старт роутера**

История создаётся и подключается эффектом из `appStarted`, а не на уровне модуля: иначе роутер стартует раньше, чем поднято хранилище, и оператор увидит `setup` поверх уже существующего турнира.

Порядок в `app.model.ts` строгий: `appStarted` → подъём хранилища → старт роутера → открытие начального роута.

- [ ] **Step 4: Создать страницы-заглушки с заголовками**

- [ ] **Step 5: Прогнать тесты и закоммитить**

---

### Task 10: Экраны

**Files:**
- Create: `app/src/widgets/bracket-board/{ui,index.ts}`, `app/src/widgets/round-runner/{ui,index.ts}`, `app/src/shared/lib/time/format.ts`
- Modify: страницы из Task 9
- Test: `app/src/shared/lib/time/format.test.ts`

**Interfaces:**
- Produces: `formatMmSs(ms: number): string`

- [ ] **Step 1: Написать падающие тесты форматирования**

```ts
test('600000 мс дают "10:00"', ...);
test('59000 мс дают "00:59"', ...);
test('0 дают "00:00"', ...);
test('отрицательное значение даёт "00:00"', ...);
```

- [ ] **Step 2: Реализовать `formatMmSs`, прогнать тест**

- [ ] **Step 3: Собрать `bracket-board`**

Колонка отборов и колонка финала. Каждый раунд — карточка `entities/round` с составом, статусом и победителем. Карточка кликабельна и ведёт на `routes.round`.

- [ ] **Step 4: Собрать `round-runner`**

Крупный таймер из `formatMmSs`, состав раунда, кнопки из `features/round-run`, выбор победителя из `features/round-winner-pick`. Статус `timeup` показывается заметно — это сигнал оператору объявить «руки от клавиатуры».

- [ ] **Step 5: Наполнить четыре страницы**

`setup` — ввод участников и кнопка жеребьёвки. `bracket` — доска и сброс. `round` — раннер. `results` — чемпион и список победителей по раундам.

- [ ] **Step 6: Проверить линтеры и закоммитить**

Run: `npx eslint . && npx steiger src`

---

### Task 11: Экран повреждённых данных и приёмка

**Files:**
- Create: `app/src/pages/broken-storage/{index.ts,ui/broken-storage-page.tsx}`
- Modify: `app/src/app/providers/app-provider.tsx`, `app/README.md`

- [ ] **Step 1: Написать падающий тест**

```ts
test('при $storageBroken приложение показывает экран восстановления вместо роутов', ...);
```

- [ ] **Step 2: Реализовать экран**

Две кнопки: «Начать заново» (пишет `EMPTY_TOURNAMENT` и снимает флаг) и «Выгрузить JSON» (скачивает `$rawBrokenPayload` файлом). Текст объясняет, что произошло, без слова «ошибка валидации контракта».

- [ ] **Step 3: Написать `app/README.md`**

Как запустить, как устроена архитектура, почему таймер хранит `deadlineAt`, почему нет `effector-refetch` и IndexedDB. Это цель «референс» из спеки — без README она не выполнена.

- [ ] **Step 4: Полная проверка**

Run: `npm run build && npm test && npx eslint . && npx steiger src`

- [ ] **Step 5: Ручной сценарий целиком**

16 имён вставкой списком → жеребьёвка → отбор 1 запущен → пауза → +2 минуты → продолжить → досрочный стоп → победитель → три отбора так же → финал собрался сам → чемпион на `results`. Отдельно: `F5` в середине раунда — турнир и таймер на месте.

- [ ] **Step 6: Commit**
