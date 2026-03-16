import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useChatStore } from '@/stores/chatStore';
import { streamChat } from '@/services/ai/streamChat';
import { toast } from 'sonner';

export default function DemoPage() {
  const { conversations, activeConversationId, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
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

    // Add user message
    addMessage(activeConversationId, {
      id: crypto.randomUUID(),
      conversationId: activeConversationId,
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);
    setStreamingContent('');

    // Build message history for context
    const history = [
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userContent },
    ].filter((m) => m.role !== 'system' as string);

    let accumulated = '';

    try {
      await streamChat({
        messages: history,
        onDelta: (chunk) => {
          accumulated += chunk;
          setStreamingContent(accumulated);
        },
        onDone: () => {
          // Add final assistant message to store
          addMessage(activeConversationId, {
            id: crypto.randomUUID(),
            conversationId: activeConversationId,
            role: 'assistant',
            content: accumulated,
            agentRole: 'orchestrator',
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
    } catch (e) {
      toast.error('Failed to connect to AI service');
      setStreamingContent('');
      setIsLoading(false);
    }
  };

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
        <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {/* Streaming message */}
          {streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming',
                conversationId: activeConversationId || '',
                role: 'assistant',
                content: streamingContent,
                agentRole: 'orchestrator',
                timestamp: new Date().toISOString(),
              }}
            />
          )}
          {/* Loading indicator */}
          {isLoading && !streamingContent && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Aria is thinking…
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
