import { create } from 'zustand';
import { Message, Conversation, AgentRole } from '@/types/domain';
import type { ConversationContext } from '@/services/ai/orchestrator';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  contexts: Record<string, ConversationContext>;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  startNewConversation: () => string;
  updateContext: (conversationId: string, updates: Partial<ConversationContext>) => void;
  getContext: (conversationId: string) => ConversationContext;
}

const defaultContext = (): ConversationContext => ({
  currentAgent: 'orchestrator',
  lastIntent: null,
  entities: {},
  turnCount: 0,
});

function createEmptyConversation(): Conversation {
  const id = `conv-${Date.now()}`;
  return {
    id,
    leadId: '',
    leadName: '',
    status: 'active',
    messages: [],
    currentAgent: 'orchestrator',
    createdAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
  };
}

export const useChatStore = create<ChatState>((set, get) => {
  const initial = createEmptyConversation();
  return {
    conversations: [initial],
    activeConversationId: initial.id,
    contexts: { [initial.id]: defaultContext() },

    setActiveConversation: (id) => set({ activeConversationId: id }),

    addMessage: (conversationId, message) =>
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, message], lastMessageAt: message.timestamp }
            : conv
        ),
      })),

    startNewConversation: () => {
      const conv = createEmptyConversation();
      set((state) => ({
        conversations: [...state.conversations, conv],
        activeConversationId: conv.id,
        contexts: { ...state.contexts, [conv.id]: defaultContext() },
      }));
      return conv.id;
    },

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
  };
});
