import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useChatStore } from '@/stores/chatStore';

export default function DemoPage() {
  const { conversations, activeConversationId, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const messages = conversation?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim() || !activeConversationId) return;
    addMessage(activeConversationId, {
      id: crypto.randomUUID(),
      conversationId: activeConversationId,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    });
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      addMessage(activeConversationId, {
        id: crypto.randomUUID(),
        conversationId: activeConversationId,
        role: 'assistant',
        content: "Thanks for your message! 👋\n\nThis is a demo — AI agent integration coming soon.\n\nIn production, Aria will route your query to the right specialist agent.",
        agentRole: 'orchestrator',
        timestamp: new Date().toISOString(),
      });
    }, 1200);
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
            {conversation ? `${conversation.leadName} • ${conversation.currentAgent} agent active` : 'No conversation'}
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
        />
        <Button onClick={handleSend} size="icon" className="gradient-bg border-0 text-primary-foreground">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
