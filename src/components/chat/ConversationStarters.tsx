import { MessageSquare, ArrowRight } from 'lucide-react';

interface Props {
  onSelect: (text: string) => void;
}

const STARTERS = [
  { emoji: '💰', text: "What's the price for 50 units of Ibuprofen?" },
  { emoji: '🚚', text: 'Tell me about your shipping policy' },
  { emoji: '📦', text: 'I want to place an order' },
  { emoji: '📝', text: 'I need a quote for my pharmacy' },
];

export function ConversationStarters({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366]/10 mb-6">
        <MessageSquare className="h-8 w-8 text-[#25D366]" />
      </div>
      <h2 className="text-lg font-bold mb-1">Welcome to MedSource</h2>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
        I'm Aria, your AI sales assistant. Try asking me:
      </p>
      <div className="w-full max-w-sm space-y-2">
        {STARTERS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s.text)}
            className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card p-3.5 text-left text-sm transition-all hover:border-[#25D366]/30 hover:bg-[#25D366]/5"
          >
            <span className="text-lg">{s.emoji}</span>
            <span className="flex-1 text-muted-foreground group-hover:text-foreground transition-colors">
              {s.text}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-[#25D366] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
