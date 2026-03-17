import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, DollarSign, Users, MessageSquare, Check, X, Send, ThumbsUp, ThumbsDown, Reply, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
  conversation_id: string | null;
  order_id: string | null;
  resolution_note: string | null;
  created_at: string;
}

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  escalation: MessageSquare,
  high_value_order: DollarSign,
  custom_pricing: DollarSign,
  approval_needed: AlertTriangle,
  new_order: Users,
  low_stock: Package,
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

const ACTIONABLE_TYPES = ['high_value_order', 'custom_pricing', 'approval_needed', 'new_order', 'escalation'];

export function AlertBell() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ alert: AdminAlert; action: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [overrideAmount, setOverrideAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('admin_alerts')
      .select('*')
      .in('status', ['pending', 'acknowledged'])
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setAlerts(data as AdminAlert[]);
  }, []);

  useEffect(() => {
    fetchAlerts();
    const channel = supabase
      .channel('admin-alerts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_alerts' }, (payload) => {
        const newAlert = payload.new as unknown as AdminAlert;
        setAlerts(prev => [newAlert, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts]);

  // Auto-refresh every 30s
  useEffect(() => {
    const i = setInterval(fetchAlerts, 30000);
    return () => clearInterval(i);
  }, [fetchAlerts]);

  const pendingCount = alerts.filter(a => a.status === 'pending').length;

  const handleAction = async (action: string) => {
    if (!actionDialog) return;
    setProcessing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/handle-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          alert_id: actionDialog.alert.id,
          action,
          reply_message: replyText || undefined,
          override_amount: overrideAmount ? parseFloat(overrideAmount) : undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast({
          title: action === 'approve' ? '✅ Approved' : action === 'reject' ? '❌ Rejected' : '💬 Reply Sent',
          description: result.whatsapp_sent ? 'Customer notified on WhatsApp' : 'Action completed',
        });
        setAlerts(prev => prev.filter(a => a.id !== actionDialog.alert.id));
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to process action', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setActionDialog(null);
      setReplyText('');
      setOverrideAmount('');
    }
  };

  const handleDismiss = async (id: string) => {
    await (supabase as any).from('admin_alerts').update({ status: 'dismissed', resolved_at: new Date().toISOString() }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const isActionable = (alert: AdminAlert) => ACTIONABLE_TYPES.includes(alert.alert_type);

  return (
    <>
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
        <PopoverContent className="w-[420px] p-0" align="end">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Alerts & Approvals</h3>
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <ScrollArea className="max-h-[500px]">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No alerts right now 🎉
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map(alert => {
                  const Icon = ALERT_ICONS[alert.alert_type] || AlertTriangle;
                  const actionable = isActionable(alert) && alert.status === 'pending';
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
                            {alert.notified_whatsapp && <span className="text-[10px] text-emerald-500">📱</span>}
                            {alert.notified_email && <span className="text-[10px] text-blue-500">📧</span>}
                          </div>

                          {/* Action buttons */}
                          {actionable && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                onClick={() => { setActionDialog({ alert, action: 'approve' }); setReplyText(''); }}
                              >
                                <ThumbsUp className="mr-1 h-3 w-3" />Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => { setActionDialog({ alert, action: 'reject' }); setReplyText(''); }}
                              >
                                <ThumbsDown className="mr-1 h-3 w-3" />Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => { setActionDialog({ alert, action: 'reply' }); setReplyText(''); }}
                              >
                                <Reply className="mr-1 h-3 w-3" />Reply
                              </Button>
                              {(alert.alert_type === 'custom_pricing' || alert.alert_type === 'high_value_order') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                                  onClick={() => { setActionDialog({ alert, action: 'override_price' }); setOverrideAmount(''); setReplyText(''); }}
                                >
                                  <DollarSign className="mr-1 h-3 w-3" />Override Price
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        {!actionable && alert.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleDismiss(alert.id)}>
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

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(v) => { if (!v) setActionDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'approve' && '✅ Approve Order'}
              {actionDialog?.action === 'reject' && '❌ Reject Order'}
              {actionDialog?.action === 'reply' && '💬 Reply to Customer'}
              {actionDialog?.action === 'override_price' && '💰 Override Pricing'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.alert.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog?.alert.description && (
              <p className="text-sm text-muted-foreground">{actionDialog.alert.description}</p>
            )}

            {actionDialog?.action === 'override_price' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Amount ($)</label>
                <Input
                  type="number"
                  placeholder="Enter custom price"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionDialog?.action === 'reply' ? 'Message to Customer' : 'Note (optional, sent to customer on WhatsApp)'}
              </label>
              <Textarea
                placeholder={actionDialog?.action === 'reply' ? 'Type your message...' : 'Add a note...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={processing}>Cancel</Button>
            <Button
              onClick={() => handleAction(actionDialog?.action || 'approve')}
              disabled={processing || (actionDialog?.action === 'reply' && !replyText) || (actionDialog?.action === 'override_price' && !overrideAmount)}
              className={cn(
                actionDialog?.action === 'approve' && 'bg-emerald-600 hover:bg-emerald-700',
                actionDialog?.action === 'reject' && 'bg-destructive hover:bg-destructive/90',
              )}
            >
              {processing ? 'Processing...' : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {actionDialog?.action === 'approve' && 'Approve & Notify'}
                  {actionDialog?.action === 'reject' && 'Reject & Notify'}
                  {actionDialog?.action === 'reply' && 'Send Reply'}
                  {actionDialog?.action === 'override_price' && 'Override & Approve'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
