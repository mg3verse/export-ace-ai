import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Database, Brain } from 'lucide-react';

export function IntegrationsPanel() {
  const comingSoon = () => toast({ title: 'Coming Soon', description: 'This integration will be available in the next release.' });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2"><MessageSquare className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <CardTitle className="text-base">WhatsApp Business API</CardTitle>
            <CardDescription>Send & receive messages</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
            <span className="text-sm text-muted-foreground">Not Connected</span>
          </div>
          <Button className="w-full" variant="outline" onClick={comingSoon}>Connect WhatsApp</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Database className="h-5 w-5 text-primary" /></div>
          <div>
            <CardTitle className="text-base">CRM Integration</CardTitle>
            <CardDescription>Sync leads & contacts</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
            <span className="text-sm text-muted-foreground">Not Connected</span>
          </div>
          <Select defaultValue="hubspot">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hubspot">HubSpot</SelectItem>
              <SelectItem value="salesforce">Salesforce</SelectItem>
              <SelectItem value="zoho">Zoho CRM</SelectItem>
            </SelectContent>
          </Select>
          <Button className="w-full" variant="outline" onClick={comingSoon}>Connect CRM</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2"><Brain className="h-5 w-5 text-violet-600" /></div>
          <div>
            <CardTitle className="text-base">AI API</CardTitle>
            <CardDescription>Lovable AI Gateway</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">Connected</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Usage</span><span>45K / 100K tokens</span>
            </div>
            <Progress value={45} />
          </div>
          <Badge variant="outline" className="text-xs">Gemini 3 Flash</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
