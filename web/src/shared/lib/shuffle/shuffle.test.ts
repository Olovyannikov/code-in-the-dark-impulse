import { expect, test } from 'vitest';

import { shuffle } from './shuffle';

/** Детерминированный источник случайности: прокручивает заданную последовательность. */
function sequence(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('с подменённым random результат детерминирован', () => {
  const items = ['a', 'b', 'c', 'd'];

  const first = shuffle(items, sequence([0.1, 0.9, 0.5, 0.3]));
  const second = shuffle(items, sequence([0.1, 0.9, 0.5, 0.3]));

  expect(first).toEqual(second);
});

test('возвращает перестановку, не теряя и не дублируя элементы', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  const result = shuffle(items, sequence([0.7, 0.2, 0.9, 0.4, 0.1, 0.6]));

  expect([...result].sort((a, b) => a - b)).toEqual(items);
});

test('не мутирует исходный массив', () => {
  const items = ['a', 'b', 'c'];

  shuffle(items, sequence([0.9, 0.1]));

  expect(items).toEqual(['a', 'b', 'c']);
});

test('пустой массив переживает перемешивание', () => {
  expect(shuffle([], sequence([0.5]))).toEqual([]);
});
