import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useChatStore } from '@/stores/chatStore';
import { streamOrchestrated, buildContextWindow } from '@/services/ai/orchestrator';
import { toast } from 'sonner';
import type { AgentRole } from '@/types/domain';

const AGENT_LABELS: Record<string, string> = {
  pricing: '💰 Pricing Agent',
  faq: '📋 FAQ Agent',
  order: '📦 Order Agent',
  qualifier: '🎯 Qualifier Agent',
  orchestrator: '🤖 Aria',
  greeting: '👋 Aria',
};

export default function DemoPage() {
  const { conversations, activeConversationId, addMessage, updateContext, getContext } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeAgent, setActiveAgent] = useState<string>('orchestrator');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const messages = conversation?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId || isLoading) return;

    const userContent = input.trim();
    setInput('');

    addMessage(activeConversationId, {
      id: crypto.randomUUID(),
      conversationId: activeConversationId,
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);
    setStreamingContent('');

    const context = getContext(activeConversationId);
    const history = buildContextWindow([...messages, { id: '', conversationId: '', role: 'user', content: userContent, timestamp: '' }]);

    let accumulated = '';
    let resolvedAgent: AgentRole = 'orchestrator';

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
  };

  const ctx = activeConversationId ? getContext(activeConversationId) : null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-card p-4 border border-border/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Aria — MedSource Sales Agent</h1>
          <p className="text-xs text-muted-foreground">
            {conversation ? `${conversation.leadName} • AI-powered` : 'No conversation'}
          </p>
        </div>
        {/* Active agent indicator */}
        <div className="ml-auto flex items-center gap-2">
          {ctx?.lastIntent && (
            <span className="flex items-center gap-1 rounded-full bg-accent/50 px-2.5 py-1 text-[10px] font-medium text-accent-foreground">
              <Zap className="h-3 w-3" />
              {AGENT_LABELS[activeAgent] || activeAgent}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
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
          {isLoading && !streamingContent && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Routing to {AGENT_LABELS[activeAgent] || 'Aria'}…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message…"
          className="flex-1 bg-card"
          disabled={isLoading}
        />
        <Button onClick={handleSend} size="icon" className="gradient-bg border-0 text-primary-foreground" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
