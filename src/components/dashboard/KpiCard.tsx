import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  detail: string;
  icon: LucideIcon;
  accentColor: 'blue' | 'green' | 'purple' | 'orange';
}

const ACCENT = {
  blue: {
    iconBg: 'bg-[hsl(221,83%,53%)]/10',
    iconText: 'text-[hsl(221,83%,53%)]',
    bar: 'bg-[hsl(221,83%,53%)]',
  },
  green: {
    iconBg: 'bg-[hsl(142,71%,45%)]/10',
    iconText: 'text-[hsl(142,71%,45%)]',
    bar: 'bg-[hsl(142,71%,45%)]',
  },
  purple: {
    iconBg: 'bg-[hsl(262,83%,58%)]/10',
    iconText: 'text-[hsl(262,83%,58%)]',
    bar: 'bg-[hsl(262,83%,58%)]',
  },
  orange: {
    iconBg: 'bg-[hsl(32,95%,50%)]/10',
    iconText: 'text-[hsl(32,95%,50%)]',
    bar: 'bg-[hsl(32,95%,50%)]',
  },
};

export function KpiCard({ title, value, subtitle, detail, icon: Icon, accentColor }: KpiCardProps) {
  const a = ACCENT[accentColor];

  return (
    <Card className="glass-card border-border/50 overflow-hidden">
      <div className={cn('h-1 w-full', a.bar)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', a.iconBg)}>
            <Icon className={cn('h-5 w-5', a.iconText)} />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground border-t border-border/50 pt-2">{detail}</p>
      </CardContent>
    </Card>
  );
}
