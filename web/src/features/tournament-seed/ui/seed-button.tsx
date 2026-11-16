import { reflect } from '@effector/reflect';
import { Button, Tooltip } from '@mantine/core';

import { SeedModel } from '../model/seed.model';

type Props = {
  disabled: boolean;
  reason: string | null;
  onClick: () => void;
};

function SeedButtonView({ disabled, reason, onClick }: Props) {
  const button = (
    <Button size="lg" disabled={disabled} onClick={onClick}>
      Жеребьёвка
    </Button>
  );

  if (!reason) return button;

  return (
    <Tooltip label={reason} multiline w={320} withArrow>
      {/* Mantine не показывает подсказку на disabled-кнопке без обёртки */}
      <span>{button}</span>
    </Tooltip>
  );
}

export const SeedButton = reflect({ view: SeedButtonView, bind: SeedModel.viewModel });
