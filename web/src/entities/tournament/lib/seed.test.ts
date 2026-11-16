import { expect, test } from 'vitest';

import type { Participant } from '@/entities/participant/@x/tournament';

import { canSeed, splitIntoHeats } from './seed';

function people(count: number): Participant[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `Участник ${i}` }));
}

const sizes = (groups: Participant[][]) => groups.map((group) => group.length);

test('16 участников дают отборы 4/4/4/4', () => {
  expect(sizes(splitIntoHeats(people(16)))).toEqual([4, 4, 4, 4]);
});

test('14 участников дают отборы 4/4/3/3, а не 4/4/4/2', () => {
  expect(sizes(splitIntoHeats(people(14)))).toEqual([4, 4, 3, 3]);
});

test('5 участников дают отборы 3/2', () => {
  expect(sizes(splitIntoHeats(people(5)))).toEqual([3, 2]);
});

test('4 участника дают единственную группу', () => {
  expect(sizes(splitIntoHeats(people(4)))).toEqual([4]);
});

test('разбиение не теряет и не дублирует участников', () => {
  const participants = people(13);

  const flat = splitIntoHeats(participants).flat();

  expect(flat.map((p) => p.id).sort()).toEqual(participants.map((p) => p.id).sort());
});

test('двое участников с одинаковым именем остаются двумя записями', () => {
  const twins: Participant[] = [
    { id: 'p1', name: 'Саша' },
    { id: 'p2', name: 'Саша' },
  ];

  const flat = splitIntoHeats(twins).flat();

  expect(flat).toHaveLength(2);
  expect(flat.map((p) => p.id)).toEqual(['p1', 'p2']);
});

test('canSeed отвергает одного участника', () => {
  expect(canSeed(1).ok).toBe(false);
});

test('canSeed принимает четверых: это турнир из одного раунда', () => {
  expect(canSeed(4).ok).toBe(true);
});

test('canSeed принимает 20', () => {
  expect(canSeed(20).ok).toBe(true);
});

test('canSeed отвергает 21 и называет причину по-русски', () => {
  const verdict = canSeed(21);

  expect(verdict.ok).toBe(false);
  if (verdict.ok) throw new Error('canSeed(21) должен был отказать');
  expect(verdict.reason).toMatch(/\S/);
});
