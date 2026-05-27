import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Copy, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RecentEvent {
  id: string;
  phone: string | null;
  agent: string | null;
  state: string | null;
  updatedAt: string;
  lastRole: string | null;
  preview: string | null;
}

interface StatusPayload {
  config: {
    accessTokenSet: boolean;
    phoneNumberIdSet: boolean;
    verifyTokenSet: boolean;
    appSecretSet: boolean;
    phoneNumberId: string | null;
  };
  webhookUrl: string;
  verification: {
    tokenValid: boolean;
    tokenError: string | null;
    displayPhoneNumber: string | null;
    verifiedName: string | null;
  };
  recentEvents: RecentEvent[];
  checkedAt: string;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function WhatsAppStatusWidget() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-status');
      if (error) throw error;
      setData(data as StatusPayload);
    } catch (e) {
      console.error('whatsapp-status error', e);
      toast.error('Failed to load WhatsApp status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const i = setInterval(fetchStatus, 60000);
    return () => clearInterval(i);
  }, [fetchStatus]);

  const copyWebhook = () => {
    if (!data?.webhookUrl) return;
    navigator.clipboard.writeText(data.webhookUrl);
    toast.success('Webhook URL copied');
  };

  const allConfigured =
    data?.config.accessTokenSet &&
    data?.config.phoneNumberIdSet &&
    data?.config.verifyTokenSet;
  const healthy = allConfigured && data?.verification.tokenValid;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-emerald-500" />
          <CardTitle className="text-sm font-semibold">WhatsApp Webhook</CardTitle>
          {!loading && data && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] capitalize',
                healthy
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : allConfigured
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-destructive/10 text-destructive border-destructive/20',
              )}
            >
              {healthy ? 'Verified' : allConfigured ? 'Token Invalid' : 'Not Configured'}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={loading} className="h-7 px-2">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && !data ? (
          <Skeleton className="h-32 w-full" />
        ) : data ? (
          <>
            {/* Verification summary */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Webhook URL</p>
                  <p className="text-xs font-mono truncate">{data.webhookUrl}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={copyWebhook} className="h-7 px-2 shrink-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {data.verification.displayPhoneNumber && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Connected:</span>
                  <span className="font-semibold">{data.verification.displayPhoneNumber}</span>
                  {data.verification.verifiedName && (
                    <span className="text-muted-foreground truncate">• {data.verification.verifiedName}</span>
                  )}
                </div>
              )}

              {data.verification.tokenError && (
                <div className="flex items-start gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="break-words">{data.verification.tokenError}</span>
                </div>
              )}
            </div>

            {/* Config checks */}
            <div className="grid grid-cols-2 gap-2">
              <ConfigItem ok={data.config.accessTokenSet && data.verification.tokenValid} label="Access Token" />
              <ConfigItem ok={data.config.phoneNumberIdSet} label="Phone Number ID" />
              <ConfigItem ok={data.config.verifyTokenSet} label="Verify Token" />
              <ConfigItem ok={data.config.appSecretSet} label="App Secret" />
            </div>

            {/* Recent events */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Recent Webhook Events
              </p>
              {data.recentEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No recent activity</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {data.recentEvents.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start gap-2 rounded-md border border-border/40 bg-card/50 p-2 text-xs"
                    >
                      <div className={cn(
                        'h-1.5 w-1.5 rounded-full mt-1.5 shrink-0',
                        e.state === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                      )} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-medium">{e.phone ?? 'unknown'}</span>
                          {e.agent && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">
                              {e.agent}
                            </Badge>
                          )}
                          <span className="text-muted-foreground ml-auto text-[10px]">{timeAgo(e.updatedAt)}</span>
                        </div>
                        {e.preview && (
                          <p className="text-muted-foreground mt-0.5 truncate">
                            <span className="text-[10px] uppercase mr-1">{e.lastRole}:</span>
                            {e.preview}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground text-right">
              Checked {timeAgo(data.checkedAt)}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConfigItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
      )}
      <span className={cn('truncate', ok ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
    </div>
  );
}
