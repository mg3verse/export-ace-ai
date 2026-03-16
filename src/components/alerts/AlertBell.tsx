import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, DollarSign, Users, MessageSquare, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AdminAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  notified_whatsapp: boolean;
  notified_email: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  escalation: MessageSquare,
  high_value_order: DollarSign,
  custom_pricing: DollarSign,
  approval_needed: AlertTriangle,
  new_order: Users,
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AlertBell() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [open, setOpen] = useState(false);

  const fetchAlerts = async () => {
    const { data } = await (supabase as any)
      .from('admin_alerts')
      .select('*')
      .in('status', ['pending', 'acknowledged'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setAlerts(data as AdminAlert[]);
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime alerts
    const channel = supabase
      .channel('admin-alerts-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_alerts',
      }, (payload) => {
        const newAlert = payload.new as unknown as AdminAlert;
        setAlerts(prev => [newAlert, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const pendingCount = alerts.filter(a => a.status === 'pending').length;

  const handleAcknowledge = async (id: string) => {
    await supabase.from('admin_alerts').update({ status: 'acknowledged' }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  };

  const handleDismiss = async (id: string) => {
    await supabase.from('admin_alerts').update({ status: 'dismissed', resolved_at: new Date().toISOString() }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className={cn('h-5 w-5', pendingCount > 0 && 'text-amber-500')} />
          {pendingCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Alerts & Approvals</h3>
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No alerts right now 🎉
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map(alert => {
                const Icon = ALERT_ICONS[alert.alert_type] || AlertTriangle;
                return (
                  <div key={alert.id} className={cn('px-4 py-3 transition-colors', alert.status === 'pending' && 'bg-amber-500/5')}>
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', SEVERITY_COLORS[alert.severity])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5', SEVERITY_COLORS[alert.severity])}>
                            {alert.severity}
                          </Badge>
                        </div>
                        {alert.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{timeAgo(alert.created_at)}</span>
                          {alert.notified_whatsapp && <span className="text-[10px] text-emerald-500">📱 WhatsApp</span>}
                          {alert.notified_email && <span className="text-[10px] text-blue-500">📧 Email</span>}
                        </div>
                      </div>
                      {alert.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleAcknowledge(alert.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDismiss(alert.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
