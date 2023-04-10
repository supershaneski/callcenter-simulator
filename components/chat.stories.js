import Chat from './chat'

export default {
  title: 'Simulator/Chat',
  component: Chat,
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

