import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, ChevronDown, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble, TypingIndicator } from '@/components/chat/MessageBubble';
import { ConversationStarters } from '@/components/chat/ConversationStarters';
import { OrderProgressTracker } from '@/components/chat/OrderProgressTracker';
import { useChatStore } from '@/stores/chatStore';
import { streamOrchestrated, buildContextWindow } from '@/services/ai/orchestrator';
import { DEMO_SCENARIOS } from '@/data/demoScenarios';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AgentRole, Message } from '@/types/domain';

const AGENT_LABELS: Record<string, string> = {
  pricing: 'Pricing Agent',
  faq: 'FAQ Agent',
  order: 'Order Agent',
  qualifier: 'Qualifier Agent',
  orchestrator: 'Aria',
  greeting: 'Aria',
};

export default function DemoPage() {
  const { conversations, activeConversationId, addMessage, updateContext, getContext } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeAgent, setActiveAgent] = useState<string>('orchestrator');
  const [showScenarios, setShowScenarios] = useState(false);
  const [orderStep, setOrderStep] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  const sendMessage = useCallback(async (userContent: string) => {
    if (!userContent.trim() || !activeConversationId || isLoading) return;

    addMessage(activeConversationId, {
      id: crypto.randomUUID(),
      conversationId: activeConversationId,
      role: 'user',
      content: userContent.trim(),
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);
    setStreamingContent('');

    const context = getContext(activeConversationId);
    const allMessages = [...messages, { id: '', conversationId: '', role: 'user' as const, content: userContent.trim(), timestamp: '' }];
    const history = buildContextWindow(allMessages);

    let accumulated = '';
    let resolvedAgent: AgentRole = 'orchestrator';

    // Detect order steps
    const lowerContent = userContent.toLowerCase();
    if (lowerContent.includes('order') || lowerContent.includes('place') || lowerContent.includes("let's do it")) {
      setOrderStep(1);
    } else if (orderStep !== null && orderStep < 5) {
      setOrderStep(orderStep + 1);
    }

    await streamOrchestrated({
      messages: history,
      context,
      onDelta: (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      },
      onMeta: (meta) => {
        resolvedAgent = meta.agent as AgentRole;
        setActiveAgent(meta.agent);
        updateContext(activeConversationId, {
          currentAgent: meta.agent as AgentRole,
          lastIntent: meta.intent,
          entities: { ...context.entities, ...meta.entities },
          turnCount: context.turnCount + 1,
        });
      },
      onDone: () => {
        addMessage(activeConversationId, {
          id: crypto.randomUUID(),
          conversationId: activeConversationId,
          role: 'assistant',
          content: accumulated,
          agentRole: resolvedAgent,
          timestamp: new Date().toISOString(),
        });
        setStreamingContent('');
        setIsLoading(false);
      },
      onError: (error) => {
        toast.error(error);
        setStreamingContent('');
        setIsLoading(false);
      },
    });
  }, [activeConversationId, isLoading, messages, addMessage, getContext, updateContext, orderStep]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const loadScenario = (scenarioId: string) => {
    if (!activeConversationId) return;
    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    // Clear current messages by adding scenario messages
    scenario.messages.forEach((msg, i) => {
      setTimeout(() => {
        addMessage(activeConversationId, {
          id: crypto.randomUUID(),
          conversationId: activeConversationId,
          role: msg.role,
          content: msg.content,
          agentRole: msg.agentRole,
          timestamp: msg.timestamp,
        });
      }, i * 200);
    });

    setShowScenarios(false);
    toast.success(`Loaded: ${scenario.label}`);
  };

  const ctx = activeConversationId ? getContext(activeConversationId) : null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-3">
      {/* WhatsApp-style header */}
      <div className="flex items-center gap-3 rounded-t-xl bg-[#075E54] px-4 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">Aria — MedSource</h1>
          <p className="text-[11px] text-white/70">
            {isLoading
              ? `${AGENT_LABELS[activeAgent] || 'Aria'} is typing…`
              : conversation
              ? `${conversation.leadName} • Online`
              : 'Online'}
          </p>
        </div>

        {/* Scenario dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowScenarios(!showScenarios)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors"
          >
            Load Demo <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showScenarios && (
            <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-card shadow-xl animate-fade-in">
              <div className="p-2 space-y-0.5">
                {DEMO_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadScenario(s.id)}
                    className="w-full text-left rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">{s.label}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat area — WhatsApp wallpaper style */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4"
        style={{
          backgroundColor: 'hsl(var(--background))',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${document.documentElement.classList.contains('dark') ? '2a2a3a' : 'e5e5e5'}' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="space-y-3">
          {/* Empty state */}
          {!hasMessages && !isLoading && (
            <ConversationStarters onSelect={handleQuickReply} />
          )}

          {/* Order progress tracker */}
          {orderStep !== null && activeAgent === 'order' && (
            <OrderProgressTracker
              currentStep={Math.min(orderStep, 5)}
              totalSteps={5}
              stepLabel={['Product', 'Quantity', 'Company', 'Shipping', 'Confirm'][Math.min(orderStep - 1, 4)]}
            />
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onQuickReply={handleQuickReply} />
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming',
                conversationId: activeConversationId || '',
                role: 'assistant',
                content: streamingContent,
                agentRole: activeAgent as AgentRole,
                timestamp: new Date().toISOString(),
              }}
            />
          )}

          {/* Typing indicator */}
          {isLoading && !streamingContent && (
            <TypingIndicator agentLabel={AGENT_LABELS[activeAgent] || 'Aria'} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick replies bar */}
      {!isLoading && hasMessages && (
        <div className="flex gap-1.5 overflow-x-auto px-1 py-2 scrollbar-none">
          {['💰 Pricing', '📋 Products', '📦 Place Order', '❓ FAQ'].map((label) => (
            <button
              key={label}
              onClick={() => handleQuickReply(label.replace(/^[^\s]+\s/, ''))}
              className="shrink-0 rounded-full border border-[#25D366]/30 bg-[#25D366]/5 px-3 py-1.5 text-xs font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/15"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input area — WhatsApp style */}
      <div className="flex items-center gap-2 rounded-b-xl bg-[#F0F2F5] dark:bg-[hsl(222,47%,9%)] px-3 py-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message…"
          className="flex-1 rounded-full border-0 bg-card px-4 py-2.5 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-[#25D366]"
          disabled={isLoading}
        />
        {input.trim() ? (
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105 active:scale-95"
            onClick={() => toast.info('Voice notes coming soon!')}
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
