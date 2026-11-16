import { expect, test } from 'vitest';

import { parseNames } from './parse-names';

test('разбивает по переводам строки', () => {
  expect(parseNames('Аня\nБоря\nВера')).toEqual(['Аня', 'Боря', 'Вера']);
});

test('выкидывает пустые строки', () => {
  expect(parseNames('Аня\n\n\nБоря\n   \n')).toEqual(['Аня', 'Боря']);
});

test('схлопывает повторные пробелы и обрезает края', () => {
  expect(parseNames('  Анна   Петровна  ')).toEqual(['Анна Петровна']);
});

test('снимает нумерацию вида "1. Имя" и "2) Имя"', () => {
  expect(parseNames('1. Аня\n2) Боря\n10.Вера')).toEqual(['Аня', 'Боря', 'Вера']);
});

test('снимает маркеры списка', () => {
  expect(parseNames('- Аня\n– Боря\n— Вера\n• Галя\n* Дима')).toEqual([
    'Аня',
    'Боря',
    'Вера',
    'Галя',
    'Дима',
  ]);
});

test('сохраняет два одинаковых имени как две записи', () => {
  expect(parseNames('Саша\nСаша')).toEqual(['Саша', 'Саша']);
});

test('не съедает дефис внутри имени', () => {
  expect(parseNames('Анна-Мария')).toEqual(['Анна-Мария']);
});

test('понимает перевод строки из Windows', () => {
  expect(parseNames('Аня\r\nБоря')).toEqual(['Аня', 'Боря']);
});

test('пустой ввод даёт пустой список', () => {
  expect(parseNames('   \n  \n')).toEqual([]);
});
