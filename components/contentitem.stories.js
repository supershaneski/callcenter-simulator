import ContentItem from './contentitem';

export default {
  title: 'Simulator/ContentItem',
  component: ContentItem,
  tags: ['autodocs'],
  argTypes: {
    onDelete: { action: 'delete' },
  },
};

export const Primary = {
  args: {
    name: 'Gandalf',
    role: 'system',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  },
};

export const Icon = {
  args: {
    role: 'system',
    name: 'Boromir',
    icon: 5,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  },
};

export const Secondary = {
  args: {
    role: 'user',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  },
};