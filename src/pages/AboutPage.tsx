import { motion } from 'framer-motion';
import { Bot, BarChart3, ShoppingCart, UserCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AGENTS = [
  { icon: UserCheck, name: 'Qualifier Agent', desc: 'Verifies buyer identity, license, and import capability' },
  { icon: Bot, name: 'Pricing Agent', desc: 'Quotes prices with bulk discounts and shipping estimates' },
  { icon: ShoppingCart, name: 'Order Agent', desc: 'Collects order details, validates minimums, confirms totals' },
  { icon: BarChart3, name: 'FAQ Agent', desc: 'Answers questions about products, shipping, and licensing' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">About MedSource International</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          We're a pharmaceutical B2B export company leveraging AI to streamline sales across emerging markets in Africa, the Middle East, and Southeast Asia.
        </p>
      </div>

      {/* Architecture */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-bold">Multi-Agent Architecture</h2>
        <p className="mt-2 text-center text-muted-foreground">How Aria orchestrates four specialized agents</p>

        <div className="relative mt-10">
          {/* Orchestrator */}
          <div className="mx-auto mb-8 w-fit rounded-xl gradient-bg px-8 py-4 text-center text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Orchestrator</p>
            <p className="text-lg font-bold">Aria</p>
          </div>

          {/* Connectors */}
          <div className="flex justify-center mb-4">
            <div className="h-8 w-px bg-border" />
          </div>
          <div className="mx-auto mb-4 flex max-w-lg justify-between px-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-px w-16 bg-border" />
                <div className="h-6 w-px bg-border" />
              </div>
            ))}
          </div>

          {/* Agent cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card h-full border-border/50">
                  <CardContent className="p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <agent.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{agent.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Markets */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold">Our Markets</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {['🇳🇬 Nigeria', '🇦🇪 UAE', '🇵🇭 Philippines', '🇰🇪 Kenya', '🇸🇦 Saudi Arabia'].map((m) => (
            <div key={m} className="glass-card rounded-xl px-6 py-4 text-center">
              <p className="text-lg font-medium">{m}</p>
              <p className="text-xs text-muted-foreground">7–10 business days</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-20 rounded-2xl bg-muted/50 p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold">Get in Touch</h2>
        <p className="mt-2 text-muted-foreground">Ready to scale your pharmaceutical procurement?</p>
        <p className="mt-4 font-medium">sales@medsource-intl.com</p>
      </div>
    </div>
  );
}
