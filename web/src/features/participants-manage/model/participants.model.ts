import { createEvent, sample } from 'effector';

import { TournamentModel } from '@/entities/tournament';
import { createModel } from '@/shared/lib/create-model';

import { parseNames } from '../lib/parse-names';
import { addParticipants, removeParticipant, renameParticipant } from '../lib/participants';

export const ParticipantsModel = createModel(() => {
  const participantAdded = createEvent<string>();
  const participantsPasted = createEvent<string>();
  const participantRemoved = createEvent<string>();
  const participantRenamed = createEvent<{ id: string; name: string }>();

  sample({
    clock: [participantAdded, participantsPasted],
    source: TournamentModel.$tournament,
    filter: (_, raw) => parseNames(raw).length > 0,
    fn: (tournament, raw) => addParticipants(tournament, parseNames(raw)),
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: participantRenamed,
    source: TournamentModel.$tournament,
    fn: renameParticipant,
    target: TournamentModel.tournamentReplaced,
  });

  sample({
    clock: participantRemoved,
    source: TournamentModel.$tournament,
    fn: removeParticipant,
    target: TournamentModel.tournamentReplaced,
  });

  return { participantAdded, participantsPasted, participantRemoved, participantRenamed };
});
