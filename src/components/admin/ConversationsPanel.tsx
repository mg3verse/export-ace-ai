import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MessageSquare, Phone, Bot, Clock, ChevronRight } from 'lucide-react';

interface ConversationRow {
  id: string;
  phone_number: string | null;
  messages: any[];
  current_agent: string | null;
  conversation_state: string | null;
  lead_score: number | null;
  created_at: string;
  updated_at: string;
}

const AGENT_COLORS: Record<string, string> = {
  pricing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  faq: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  order: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  qualifier: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  greeting: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  orchestrator: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const STATE_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  completed: 'bg-muted text-muted-foreground',
  escalated: 'bg-destructive/10 text-destructive border-destructive/20',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ConversationsPanel() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setConversations((data as unknown as ConversationRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [fetch]);

  const selected = conversations.find((c) => c.id === selectedId);
  const messages = (selected?.messages || []) as { role: string; content: string; agent_role?: string; timestamp?: string }[];

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      {/* Conversation list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            WhatsApp Conversations ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors hover:bg-muted/50',
                      selectedId === c.id && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{c.phone_number || 'Web Session'}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', AGENT_COLORS[c.current_agent || ''])}>
                        {c.current_agent || 'unknown'}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[10px]', STATE_COLORS[c.conversation_state || ''])}>
                        {c.conversation_state || 'active'}
                      </Badge>
                      {c.lead_score !== null && c.lead_score > 0 && (
                        <span className="text-[10px] text-muted-foreground">Score: {c.lead_score}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{timeAgo(c.updated_at)}</span>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {((c.messages as any[]) || []).length} msgs
                      </span>
                    </div>
                  </button>
                ))}
                {conversations.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">No conversations yet</div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Message viewer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {selected ? (
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {selected.phone_number || 'Web Session'}
                <Badge variant="outline" className={cn('ml-2 text-xs', AGENT_COLORS[selected.current_agent || ''])}>
                  {selected.current_agent}
                </Badge>
              </span>
            ) : (
              'Select a conversation'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selected ? (
            <div className="flex h-[450px] items-center justify-center text-muted-foreground">
              <p className="text-sm">← Click a conversation to view messages</p>
            </div>
          ) : (
            <ScrollArea className="h-[450px]">
              <div className="space-y-3 pr-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'ml-auto bg-[#DCF8C6] text-foreground dark:bg-[#025C4C] dark:text-white'
                        : 'bg-muted'
                    )}
                  >
                    {msg.role === 'assistant' && msg.agent_role && (
                      <div className="mb-1 flex items-center gap-1">
                        <Bot className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">{msg.agent_role}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">No messages in this conversation</div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
