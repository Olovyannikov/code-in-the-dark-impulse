import { expect, test } from 'vitest';

import { formatMmSs } from './format';

test('600000 мс дают "10:00"', () => {
  expect(formatMmSs(600_000)).toBe('10:00');
});

test('59000 мс дают "00:59"', () => {
  expect(formatMmSs(59_000)).toBe('00:59');
});

test('0 даёт "00:00"', () => {
  expect(formatMmSs(0)).toBe('00:00');
});

test('отрицательное значение даёт "00:00"', () => {
  expect(formatMmSs(-5_000)).toBe('00:00');
});

test('неполная секунда округляется вверх, чтобы ноль появлялся ровно в конце', () => {
  expect(formatMmSs(1)).toBe('00:01');
});

test('больше часа показывается в минутах', () => {
  expect(formatMmSs(3_900_000)).toBe('65:00');
});
