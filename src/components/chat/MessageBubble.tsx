import { cn } from '@/lib/utils';
import { Message } from '@/types/domain';
import { formatTime } from '@/utils/formatters';
import { Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const AGENT_LABELS: Record<string, string> = {
  pricing: 'Pricing Agent',
  faq: 'FAQ Agent',
  order: 'Order Agent',
  qualifier: 'Qualifier Agent',
  orchestrator: 'Aria',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div className={cn('max-w-[75%] space-y-1')}>
        {!isUser && message.agentRole && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
            {AGENT_LABELS[message.agentRole] || message.agentRole}
          </span>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line',
            isUser
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md bg-muted text-foreground'
          )}
        >
          {message.content}
        </div>
        <p className={cn('text-[10px] text-muted-foreground', isUser && 'text-right')}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
