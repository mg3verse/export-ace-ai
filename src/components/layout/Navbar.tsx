import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Demo', href: '/demo' },
  { label: 'Agents', href: '/agents' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Admin', href: '/admin' },
  { label: 'About', href: '/about' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
            <Pill className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            MedSource
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted',
                location.pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex">
          <Button asChild size="sm" className="gradient-bg border-0 text-primary-foreground">
            <Link to="/demo">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-4 pb-4 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                location.pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
          ))}
          <Button size="sm" className="mt-3 w-full gradient-bg border-0 text-primary-foreground">
            Get Started
          </Button>
        </div>
      )}
    </nav>
  );
}
