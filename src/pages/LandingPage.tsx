import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, BarChart3, ShoppingCart, UserCheck, ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: Bot, title: 'AI Sales Agent', desc: 'Aria handles pricing, FAQs, and order collection via WhatsApp — 24/7.' },
  { icon: BarChart3, title: 'Real-Time Dashboard', desc: 'Track revenue, leads, and conversion metrics across all markets.' },
  { icon: ShoppingCart, title: 'Order Management', desc: 'From quote to delivery — automated order workflows with full visibility.' },
  { icon: UserCheck, title: 'Buyer Qualification', desc: 'Automatically verify licenses, assess volume, and tier your buyers.' },
];

const MARKETS = ['Nigeria', 'UAE', 'Philippines', 'Kenya', 'Saudi Arabia'];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Globe className="h-3.5 w-3.5" /> Pharma B2B Export Platform
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Global Pharma Export,{' '}
              <span className="gradient-text">Orchestrated by Intelligence</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              MedSource International's AI-powered sales agent handles pricing, qualification, and orders across 5+ markets — so your team can focus on relationships, not repetition.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild size="lg" className="gradient-bg border-0 px-8 text-primary-foreground">
              <Link to="/demo">
                Try Live Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </motion.div>

          {/* Market badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-3"
          >
            <span className="text-sm text-muted-foreground">Active markets:</span>
            {MARKETS.map((m) => (
              <span key={m} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
                {m}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Multi-Agent Architecture</h2>
            <p className="mt-3 text-muted-foreground">Four specialized AI agents, one seamless experience</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl gradient-bg p-10 text-center text-primary-foreground sm:p-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to automate your pharma export sales?</h2>
          <p className="mt-4 text-primary-foreground/80">Start with our live demo and see Aria in action.</p>
          <Button asChild size="lg" variant="secondary" className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link to="/demo">Launch Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2024 MedSource International. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
