import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const AI_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Fast)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Best)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Balanced)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5', label: 'GPT-5 (Premium)' },
];

interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  agents: { pricing: boolean; faq: boolean; order: boolean; qualifier: boolean };
  leadThresholds: { hot: number; warm: number; cold: number };
  autoApproveThreshold: number;
  lowStockThreshold: number;
}

const DEFAULTS: AgentConfig = {
  model: 'google/gemini-3-flash-preview',
  temperature: 0.7,
  maxTokens: 1000,
  agents: { pricing: true, faq: true, order: true, qualifier: true },
  leadThresholds: { hot: 80, warm: 60, cold: 40 },
  autoApproveThreshold: 500,
  lowStockThreshold: 10,
};

export function AgentSettingsPanel() {
  const [config, setConfig] = useState<AgentConfig>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('key', 'agent_config').maybeSingle();
      if (data?.value) setConfig({ ...DEFAULTS, ...(data.value as unknown as Partial<AgentConfig>) });
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await supabase.from('app_settings').upsert({ key: 'agent_config', value: config as any, updated_at: new Date().toISOString() } as any, { onConflict: 'key' });
      toast({ title: 'Settings Saved', description: 'Agent configuration updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Model Configuration</CardTitle>
          <CardDescription>Configure the AI model powering your agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select value={config.model} onValueChange={(v) => setConfig((c) => ({ ...c, model: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Temperature: {config.temperature.toFixed(2)}</Label>
            <Slider value={[config.temperature]} min={0} max={1} step={0.05} onValueChange={([v]) => setConfig((c) => ({ ...c, temperature: v }))} />
            <p className="text-xs text-muted-foreground">Lower = more precise, Higher = more creative</p>
          </div>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input type="number" min={100} max={4000} value={config.maxTokens} onChange={(e) => setConfig((c) => ({ ...c, maxTokens: parseInt(e.target.value) || 1000 }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enable / Disable Agents</CardTitle>
          <CardDescription>Toggle individual AI agents on or off</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(['pricing', 'faq', 'order', 'qualifier'] as const).map((agent) => (
            <div key={agent} className="flex items-center justify-between">
              <Label className="capitalize">{agent === 'qualifier' ? 'Buyer Qualification' : `${agent} Agent`}</Label>
              <Switch checked={config.agents[agent]} onCheckedChange={(v) => setConfig((c) => ({ ...c, agents: { ...c.agents, [agent]: v } }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Scoring Thresholds</CardTitle>
          <CardDescription>Define point thresholds for lead classification</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {(['hot', 'warm', 'cold'] as const).map((tier) => (
            <div key={tier} className="space-y-2">
              <Label className="capitalize">{tier} Lead</Label>
              <Input type="number" min={0} max={100} value={config.leadThresholds[tier]} onChange={(e) => setConfig((c) => ({ ...c, leadThresholds: { ...c.leadThresholds, [tier]: parseInt(e.target.value) || 0 } }))} />
              <p className="text-xs text-muted-foreground">≥ {config.leadThresholds[tier]} points</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        <Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Agent Settings'}
      </Button>
    </div>
  );
}
