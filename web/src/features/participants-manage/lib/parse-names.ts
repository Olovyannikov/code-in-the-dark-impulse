/** Нумерация "1." / "2)" и маркеры списка в начале строки — мусор из чужих документов. */
const LIST_PREFIX = /^\s*(?:\d+\s*[.)]|[-–—•*])\s*/;

/**
 * Разбирает список имён, вставленный из мессенджера или таблицы.
 * Одинаковые имена остаются разными записями: два Саши — это два человека.
 */
export function parseNames(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(LIST_PREFIX, ''))
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length > 0);
}
