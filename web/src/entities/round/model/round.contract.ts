import { arr, num, obj, or, str, val } from '@withease/contracts';

export const roundKindContract = or(val('heat'), val('final'));

export const roundStatusContract = or(
  val('pending'),
  val('running'),
  val('paused'),
  val('timeup'),
  val('finished'),
);

const nullableStr = or(str, val(null));
const nullableNum = or(num, val(null));

export const roundContract = obj({
  id: str,
  kind: roundKindContract,
  order: num,
  participantIds: arr(str),
  status: roundStatusContract,
  winnerId: nullableStr,
  durationMs: num,
  deadlineAt: nullableNum,
  remainingMs: nullableNum,
});

export type RoundKind = 'heat' | 'final';
export type RoundStatus = 'pending' | 'running' | 'paused' | 'timeup' | 'finished';

export type Round = {
  id: string;
  kind: RoundKind;
  order: number;
  participantIds: string[];
  status: RoundStatus;
  winnerId: string | null;
  durationMs: number;
  deadlineAt: number | null;
  remainingMs: number | null;
};
