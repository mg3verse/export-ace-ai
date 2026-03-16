import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PricingAgent from '@/components/agents/PricingAgent';
import FAQAgent from '@/components/agents/FAQAgent';

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Agent Tools</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Interactive agent panels — pricing calculator and FAQ knowledge base.
      </p>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing">💰 Pricing Agent</TabsTrigger>
          <TabsTrigger value="faq">📋 FAQ Agent</TabsTrigger>
        </TabsList>
        <TabsContent value="pricing" className="mt-4">
          <PricingAgent />
        </TabsContent>
        <TabsContent value="faq" className="mt-4">
          <FAQAgent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
