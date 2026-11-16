import { obj, str } from '@withease/contracts';

export const participantContract = obj({
  id: str,
  name: str,
});

export type Participant = {
  id: string;
  name: string;
};
