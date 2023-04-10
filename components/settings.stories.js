import Settings from './settings'

export default {
  title: 'Simulator/Settings',
  component: Settings,
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'confirm' },
    onClose: { action: 'close' },
  },
}

export const Primary = {
  args: {
    bookId: 'str0001',
    chapterId: 'cha0002',
    characterId: 'chr0002',
  },
}

