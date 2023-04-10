import VoiceCall from './voicecall'

export default {
  title: 'Simulator/VoiceCall',
  component: VoiceCall,
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

