import { create } from 'zustand';
import { Message, Conversation, AgentRole } from '@/types/domain';
import { SAMPLE_CONVERSATION } from '@/data/sampleData';
import type { ConversationContext } from '@/services/ai/orchestrator';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  contexts: Record<string, ConversationContext>;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateContext: (conversationId: string, updates: Partial<ConversationContext>) => void;
  getContext: (conversationId: string) => ConversationContext;
}

const defaultContext = (): ConversationContext => ({
  currentAgent: 'orchestrator',
  lastIntent: null,
  entities: {},
  turnCount: 0,
});

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [SAMPLE_CONVERSATION],
  activeConversationId: SAMPLE_CONVERSATION.id,
  contexts: { [SAMPLE_CONVERSATION.id]: defaultContext() },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message], lastMessageAt: message.timestamp }
          : conv
      ),
    })),

  updateContext: (conversationId, updates) =>
    set((state) => ({
      contexts: {
        ...state.contexts,
        [conversationId]: { ...(state.contexts[conversationId] || defaultContext()), ...updates },
      },
    })),

  getContext: (conversationId) => {
    return get().contexts[conversationId] || defaultContext();
  },
}));
