import { cn } from '@/lib/utils';
import { Message } from '@/types/domain';
import { formatTime } from '@/utils/formatters';
import { Bot, CheckCheck, Mic } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onQuickReply?: (text: string) => void;
}

const AGENT_LABELS: Record<string, { label: string; emoji: string }> = {
  pricing: { label: 'Pricing Agent', emoji: '💰' },
  faq: { label: 'FAQ Agent', emoji: '📋' },
  order: { label: 'Order Agent', emoji: '📦' },
  qualifier: { label: 'Qualifier Agent', emoji: '🎯' },
  orchestrator: { label: 'Aria', emoji: '🤖' },
  greeting: { label: 'Aria', emoji: '👋' },
};

/** Detect quick reply buttons from message content like [Button: text] */
function extractQuickReplies(content: string): { cleanContent: string; replies: string[] } {
  const regex = /\[(?:Button|Quick|Reply|Option):\s*(.+?)\]/gi;
  const replies: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    replies.push(match[1].trim());
  }
  const cleanContent = content.replace(regex, '').trim();
  return { cleanContent, replies };
}

/** Extract context entities like product names, quantities, countries */
function extractEntities(content: string): string[] {
  const entities: string[] = [];
  // Product detection
  const products = content.match(/(?:Paracetamol|Amoxicillin|Ibuprofen|Metformin|Azithromycin|Omeprazole|Ciprofloxacin|Losartan|Cetirizine|Doxycycline)\s*\d*\s*mg/gi);
  if (products) products.forEach(p => entities.push(`💊 ${p}`));
  // Quantity detection
  const qty = content.match(/(\d+)\s*(?:units?|boxes?|packs?)/gi);
  if (qty) qty.forEach(q => entities.push(`📦 ${q}`));
  // Country detection
  const countries = content.match(/(?:Nigeria|UAE|India|Kenya|Philippines|Saudi Arabia|Pakistan|Egypt)/gi);
  if (countries) countries.forEach(c => entities.push(`🌍 ${c}`));
  // Currency detection
  const currencies = content.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (currencies) currencies.forEach(c => entities.push(`💵 ${c}`));
  return [...new Set(entities)].slice(0, 5);
}

export function MessageBubble({ message, onQuickReply }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  if (isSystem) return null;

  const { cleanContent, replies } = isUser
    ? { cleanContent: message.content, replies: [] }
    : extractQuickReplies(message.content);
  
  const entities = !isUser ? extractEntities(message.content) : [];
  const agent = message.agentRole ? AGENT_LABELS[message.agentRole] : null;

  return (
    <div className={cn('flex gap-2 animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar */}
      {!isUser && (
        <div className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10">
          <Bot className="h-4 w-4 text-[#25D366]" />
        </div>
      )}

      <div className={cn('max-w-[78%] space-y-1.5')}>
        {/* Agent label */}
        {!isUser && agent && (
          <span className="text-[10px] font-semibold tracking-wider text-[#25D366]">
            {agent.emoji} {agent.label}
          </span>
        )}

        {/* Context entity pills */}
        {entities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entities.map((e, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-[#25D366]/10 px-2 py-0.5 text-[10px] font-medium text-[#25D366]"
              >
                {e}
              </span>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'relative rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'rounded-br-sm bg-[#DCF8C6] text-[#111B21]'
              : 'rounded-bl-sm bg-card text-foreground border border-border/30'
          )}
        >
          {/* WhatsApp tail */}
          <div
            className={cn(
              'absolute top-0 h-3 w-3',
              isUser
                ? '-right-1.5 border-l-[6px] border-t-[6px] border-l-transparent border-t-[#DCF8C6]'
                : '-left-1.5 border-r-[6px] border-t-[6px] border-r-transparent border-t-card'
            )}
          />

          {/* Content with WhatsApp-style formatting */}
          <div className="whitespace-pre-line break-words">
            {cleanContent.split(/(\*[^*]+\*)/).map((part, i) => {
              if (part.startsWith('*') && part.endsWith('*')) {
                return <strong key={i}>{part.slice(1, -1)}</strong>;
              }
              return <span key={i}>{part}</span>;
            })}
          </div>

          {/* Timestamp + read receipt */}
          <div className={cn('mt-1 flex items-center gap-1 justify-end')}>
            <span className="text-[10px] text-muted-foreground/70">
              {formatTime(message.timestamp)}
            </span>
            {isUser && (
              <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
            )}
          </div>
        </div>

        {/* Quick reply buttons */}
        {replies.length > 0 && onQuickReply && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {replies.map((r, i) => (
              <button
                key={i}
                onClick={() => onQuickReply(r)}
                className="rounded-full border border-[#25D366]/30 bg-[#25D366]/5 px-3 py-1.5 text-xs font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/15"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <span className="text-xs font-bold text-muted-foreground">U</span>
        </div>
      )}
    </div>
  );
}

/** Typing indicator component */
export function TypingIndicator({ agentLabel }: { agentLabel: string }) {
  return (
    <div className="flex gap-2 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10">
        <Bot className="h-4 w-4 text-[#25D366]" />
      </div>
      <div className="space-y-1">
        <span className="text-[10px] font-semibold tracking-wider text-[#25D366]">
          🤖 {agentLabel} is responding
        </span>
        <div className="inline-flex items-center gap-1.5 rounded-lg rounded-bl-sm bg-card border border-border/30 px-4 py-3 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

/** Voice note button (UI only) */
export function VoiceNoteButton() {
  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105 active:scale-95"
      onClick={() => {}}
      title="Voice note (coming soon)"
    >
      <Mic className="h-4 w-4" />
    </button>
  );
}
