import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LiveFeedItem } from '@/stores/dashboardStore';

interface Props {
  items: LiveFeedItem[];
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const AGENT_ICONS: Record<string, string> = {
  'Pricing Agent': '💰',
  'FAQ Agent': '📋',
  'Order Agent': '📦',
  'Qualifier Agent': '🎯',
  System: '⚙️',
};

const AGENT_DOTS: Record<string, string> = {
  'Pricing Agent': 'bg-[hsl(221,83%,53%)]',
  'FAQ Agent': 'bg-[hsl(142,71%,45%)]',
  'Order Agent': 'bg-[hsl(262,83%,58%)]',
  'Qualifier Agent': 'bg-[hsl(32,95%,50%)]',
  System: 'bg-muted-foreground',
};

export function LiveFeed({ items }: Props) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Live Feed</CardTitle>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="divide-y divide-border/50">
            {items.length === 0 && (
              <p className="p-4 text-sm text-center text-muted-foreground">No recent activity</p>
            )}
            {items.map((item, i) => (
              <div key={item.id + i} className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="mt-0.5 flex flex-col items-center gap-1">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${AGENT_DOTS[item.agentType] ?? 'bg-muted-foreground'}`} />
                  {i < items.length - 1 && <div className="w-px flex-1 bg-border/50" />}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold">
                      {AGENT_ICONS[item.agentType] || '🤖'} {item.agentType}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(item.timestamp)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.customerName}</p>
                  <p className="text-xs font-medium truncate">→ {item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
