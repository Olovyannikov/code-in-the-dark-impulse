import type { Round } from '@/entities/round/@x/tournament';

/** Победители завершённых отборов в порядке их проведения — состав будущего финала. */
export function collectHeatWinners(rounds: readonly Round[]): string[] {
  return rounds
    .filter((round) => round.kind === 'heat' && round.winnerId !== null)
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((round) => round.winnerId as string);
}

/** Чемпион — производное от финала, отдельным полем не хранится. */
export function findChampionId(rounds: readonly Round[]): string | null {
  return rounds.find((round) => round.kind === 'final')?.winnerId ?? null;
}
