/** Версия формата сохраняемых данных. Меняется при несовместимом изменении Tournament. */
export const SCHEMA_VERSION = 1;

/** Рабочих мест в зале — столько человек играет в одном раунде. */
export const HEAT_SIZE = 4;

/** Меньше двоих — это не соревнование, а показ. */
export const MIN_HEAT_SIZE = 2;

/** Больше пяти отборов не влезает в вечер: нужен дополнительный круг, которого нет. */
export const MAX_HEATS = 5;

export const HEAT_DURATION_MS = 10 * 60 * 1000;
export const FINAL_DURATION_MS = 15 * 60 * 1000;
