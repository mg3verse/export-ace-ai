import type { AgentRole, Message } from '@/types/domain';
import { ESCALATION_MESSAGE } from './prompts';

const ORCHESTRATOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrator`;

export interface OrchestratorResponse {
  intent: string;
  confidence: number;
  agent: AgentRole;
  entities: Record<string, unknown>;
}

export interface ConversationContext {
  currentAgent: AgentRole;
  lastIntent: string | null;
  entities: Record<string, unknown>;
  turnCount: number;
}

/** Build a rolling window of the last N messages for context */
export function buildContextWindow(messages: Message[], maxMessages = 20): { role: 'user' | 'assistant'; content: string }[] {
  const filtered = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  
  // If conversation is long, prepend a summary of earlier messages
  if (filtered.length > maxMessages) {
    const earlier = filtered.slice(0, filtered.length - maxMessages);
    const summary = earlier.map(m => `${m.role}: ${m.content.slice(0, 100)}`).join(' | ');
    return [
      { role: 'user' as const, content: `[Earlier conversation summary: ${summary}]` },
      ...filtered.slice(-maxMessages),
    ];
  }
  return filtered;
}

/** Stream a response from the orchestrator edge function */
export async function streamOrchestrated({
  messages,
  context,
  onDelta,
  onMeta,
  onDone,
  onError,
}: {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: ConversationContext;
  onDelta: (text: string) => void;
  onMeta: (meta: OrchestratorResponse) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const resp = await fetch(ORCHESTRATOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, context }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({ error: 'Request failed' }));
      if (resp.status === 429) {
        onError('Rate limit exceeded. Please try again in a moment.');
        return;
      }
      if (resp.status === 402) {
        onError('AI credits exhausted. Please top up your workspace.');
        return;
      }
      onError(body.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError('No response stream');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);

          // Handle metadata event from orchestrator
          if (parsed.type === 'meta') {
            onMeta(parsed.data as OrchestratorResponse);
            continue;
          }

          // Handle escalation
          if (parsed.type === 'escalate') {
            onDelta(ESCALATION_MESSAGE);
            streamDone = true;
            break;
          }

          // Standard streaming content
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch {
    onError('Failed to connect to AI service');
  }
}
