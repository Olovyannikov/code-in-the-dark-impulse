/**
 * Перемешивание Фишера — Йетса с инъекцией источника случайности,
 * чтобы жеребьёвку можно было воспроизвести в тестах.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
