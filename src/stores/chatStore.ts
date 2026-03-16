import { create } from 'zustand';
import { Message, Conversation } from '@/types/domain';
import { SAMPLE_CONVERSATION } from '@/data/sampleData';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [SAMPLE_CONVERSATION],
  activeConversationId: SAMPLE_CONVERSATION.id,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message], lastMessageAt: message.timestamp }
          : conv
      ),
    })),
}));
