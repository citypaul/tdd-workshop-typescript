import type { Preview } from '@storybook/react-vite';
import '../web/styles/global.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'void',
      values: [{ name: 'void', value: '#0a0a0a' }],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
