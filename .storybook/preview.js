/** @type { import('@storybook/react').Preview } */

import { AppRouterContext } from 'next/dist/shared/lib/app-router-context'

import '../assets/preview.css' // grid

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  nextRouter: {
    Provider: AppRouterContext.Provider,
  },
};

export default preview;
