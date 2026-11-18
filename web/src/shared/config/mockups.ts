/**
 * Каталог макетов. Папки в mockups/ — источник правды, здесь только то,
 * что нужно оператору: как называется и к какому уровню относится.
 */
export type MockupLevel = 1 | 2 | 3;

export type Mockup = {
  /** Совпадает с именем папки в mockups/ и адресом бандла в /editor/<id>/ */
  id: string;
  title: string;
  level: MockupLevel;
};

export const MOCKUPS: Mockup[] = [
  { id: 'round-01', title: 'Импульс 2026 — обложка', level: 1 },
  { id: 'round-02', title: 'Импульс 2026 — круг', level: 1 },
  { id: 'lvl1-404', title: '404 — ушла на конференцию', level: 1 },
  { id: 'lvl1-friday', title: 'Не деплой в пятницу', level: 1 },
  { id: 'lvl1-coffee', title: 'Сначала кофе', level: 1 },
  { id: 'lvl1-certificate', title: 'Сертификат «работает у меня»', level: 1 },

  { id: 'round-03', title: 'Импульс 2026 — стикер', level: 2 },
  { id: 'round-04', title: 'Импульс 2026 — вылет за край', level: 2 },
  { id: 'lvl2-vacancy', title: 'Ищем единорога', level: 2 },
  { id: 'lvl2-weather', title: 'Погода в продакшене', level: 2 },
  { id: 'lvl2-player', title: 'Lo-fi для отладки', level: 2 },

  { id: 'round-05', title: 'Импульс 2026 — финал', level: 3 },
  { id: 'round-06-spare', title: 'Импульс 2026 — цитата', level: 3 },
  { id: 'lvl3-desktop', title: 'Рабочий стол', level: 3 },
  { id: 'lvl3-canteen', title: 'Столовая «Легаси»', level: 3 },
  { id: 'lvl3-concert', title: 'Переполнение стека — тур', level: 3 },
];

export const LEVEL_TITLES: Record<MockupLevel, string> = {
  1: 'Уровень 1 — первые отборы',
  2: 'Уровень 2 — поздние отборы',
  3: 'Уровень 3 — финал',
};

export function findMockup(id: string | null): Mockup | null {
  if (id === null) return null;
  return MOCKUPS.find((mockup) => mockup.id === id) ?? null;
}

/**
 * Адрес бандла на том же хосте, что и приложение. Учитывает подпуть
 * GitHub Pages: приложение лежит в корне base, бандлы — в base/editor/.
 */
export function mockupBundleUrl(id: string): string {
  return `${import.meta.env.BASE_URL}editor/${id}/`;
}
