import SelectInquiry from './selectinquiry'

export default {
  title: 'Simulator/SelectInquiry',
  component: SelectInquiry,
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

