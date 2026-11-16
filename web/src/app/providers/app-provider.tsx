import { MantineProvider, createTheme } from '@mantine/core';
import type { PropsWithChildren } from 'react';

/** Палитра «Импульс 2026»: чёрный фон, белый текст, циановый акцент. */
const theme = createTheme({
  primaryColor: 'impulse',
  colors: {
    impulse: [
      '#E6F6FE', '#CCEDFD', '#99DBFB', '#66C9F9', '#33B7F7',
      '#1DAFF7', '#178CC6', '#116994', '#0B4663', '#062331',
    ],
  },
  fontFamily: "'ALS Hauss', Helvetica, Arial, sans-serif",
  headings: { fontFamily: "'ALS Hauss', Helvetica, Arial, sans-serif" },
  // Фон «Импульса» — чистый чёрный, а не дефолтный тёмно-серый Mantine.
  other: { impulseBlack: '#000000' },
});

const cssVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    '--mantine-color-body': '#000000',
    '--mantine-color-text': '#FFFFFF',
    '--mantine-color-dimmed': '#AEB1B7',
  },
});

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="dark"
      forceColorScheme="dark"
      cssVariablesResolver={cssVariablesResolver}
    >
      {children}
    </MantineProvider>
  );
}
