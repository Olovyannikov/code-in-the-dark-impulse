/**
 * Остаток округляется вверх: пока на часах есть хоть миллисекунда,
 * зал должен видеть «00:01», а не преждевременный ноль.
 */
export function formatMmSs(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(ms, 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
