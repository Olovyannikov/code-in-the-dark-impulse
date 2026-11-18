import { describe, expect, test } from 'vitest';

import type { Tournament } from './tournament.contract';
import { tournamentContract } from './tournament.contract';

function validTournament(): Tournament {
  return {
    schemaVersion: 1,
    participants: [
      { id: 'p1', name: 'Аня' },
      { id: 'p2', name: 'Боря' },
    ],
    rounds: [
      {
        id: 'r1',
        kind: 'heat',
        order: 0,
        participantIds: ['p1', 'p2'],
        status: 'finished',
        winnerId: 'p1',
        durationMs: 600_000,
        deadlineAt: null,
        remainingMs: null,
      },
    ],
    seededAt: 1_700_000_000_000,
  };
}

describe('tournamentContract', () => {
  test('валидный турнир проходит контракт', () => {
    expect(tournamentContract.isData(validTournament())).toBe(true);
  });

  test('турнир с чужой schemaVersion не проходит', () => {
    const broken = { ...validTournament(), schemaVersion: 2 };

    expect(tournamentContract.isData(broken)).toBe(false);
  });

  test('раунд с неизвестным status не проходит', () => {
    const t = validTournament();
    const broken = { ...t, rounds: [{ ...t.rounds[0], status: 'running-ish' }] };

    expect(tournamentContract.isData(broken)).toBe(false);
  });

  test('раунд, где winnerId не из participantIds, не проходит', () => {
    const t = validTournament();
    const broken = { ...t, rounds: [{ ...t.rounds[0], winnerId: 'p2-ghost' }] };

    expect(tournamentContract.isData(broken)).toBe(false);
  });

  test('раунд со ссылкой на несуществующего участника не проходит', () => {
    const t = validTournament();
    const broken = { ...t, rounds: [{ ...t.rounds[0], participantIds: ['p1', 'p404'] }] };

    expect(tournamentContract.isData(broken)).toBe(false);
  });

  test('winnerId null допустим для незавершённого раунда', () => {
    const t = validTournament();
    const ok = {
      ...t,
      rounds: [{ ...t.rounds[0], status: 'pending' as const, winnerId: null }],
    };

    expect(tournamentContract.isData(ok)).toBe(true);
  });

  test.each([null, undefined, 42, 'строка', [], {}, { participants: 'нет' }])(
    'мусор %p не проходит контракт и не роняет его',
    (garbage) => {
      expect(() => tournamentContract.isData(garbage)).not.toThrow();
      expect(tournamentContract.isData(garbage)).toBe(false);
    },
  );

  test('сообщение об ошибке называет причину', () => {
    const broken = { ...validTournament(), schemaVersion: 99 };

    expect(tournamentContract.getErrorMessages(broken).join(' ')).toContain('schemaVersion');
  });
});

describe('назначенный раунду макет', () => {
  test('раунд с mockupId проходит контракт', () => {
    const t = validTournament();
    const withMockup = { ...t, rounds: [{ ...t.rounds[0], mockupId: 'lvl2-weather' }] };

    expect(tournamentContract.isData(withMockup)).toBe(true);
  });

  test('турнир, сохранённый до появления макетов, всё ещё читается', () => {
    const t = validTournament();
    const legacy = { ...t, rounds: [{ ...t.rounds[0] }] };
    delete (legacy.rounds[0] as { mockupId?: unknown }).mockupId;

    expect(tournamentContract.isData(legacy)).toBe(true);
  });

  test('mockupId не строка — контракт не проходит', () => {
    const t = validTournament();
    const broken = { ...t, rounds: [{ ...t.rounds[0], mockupId: 42 }] };

    expect(tournamentContract.isData(broken)).toBe(false);
  });
});
