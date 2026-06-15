'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Handshake,
  BarChart3,
  LineChart,
  FileText,
  Receipt,
  Eye,
  Building2,
  Plus,
  Zap,
  Menu,
  X,
  Bell,
  Settings,
  ChevronDown,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';

/* ── Nav link definitions ──────────────────────────────────── */

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_LINKS: NavLink[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & key metrics',
  },
  {
    href: '/deals',
    label: 'Deals',
    icon: Handshake,
    description: 'Manage brand deals',
  },
  {
    href: '/rate-intelligence',
    label: 'Rate Intelligence',
    icon: BarChart3,
    description: 'Market rates & benchmarks',
  },
  {
    href: '/performance',
    label: 'Performance',
    icon: LineChart,
    description: 'Track content analytics',
  },
  {
    href: '/contracts',
    label: 'Contracts',
    icon: FileText,
    description: 'AI contract analysis',
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: Receipt,
    description: 'Invoice management',
  },
  {
    href: '/invisible-tax',
    label: 'Invisible Tax',
    icon: Eye,
    description: 'Hidden costs & deductions',
  },
  {
    href: '/financial-runway',
    label: 'Runway',
    icon: TrendingUp,
    description: '30/60/90-day projections',
  },
  {
    href: '/brand-portal',
    label: 'Brand Portal',
    icon: Building2,
    description: 'Secure brand access links',
  },
];

/* ── TopNav Component ──────────────────────────────────────── */

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  // Synchronize initial theme preference
  React.useEffect(() => {
    const isLight =
      localStorage.getItem('theme') === 'light' ||
      (!localStorage.getItem('theme') &&
        window.matchMedia('(prefers-color-scheme: light)').matches);
    if (isLight) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile nav is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'h-16',
          'bg-background/80 backdrop-blur-xl',
          'border-b border-border/50',
          'shadow-[0_1px_0_0_hsl(var(--border)/0.5)]',
        )}
        role="banner"
      >
        <div className="mx-auto flex h-full max-w-screen-2xl items-center gap-6 px-4 lg:px-6">
          {/* ── Logo ───────────────────────────────────────── */}
          <Link
            href="/dashboard"
            className="flex flex-shrink-0 items-center gap-2.5 group"
            aria-label="CreatorOS — Go to dashboard"
            id="nav-logo"
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'bg-gradient-to-br from-primary to-accent',
                'shadow-glow-sm group-hover:shadow-glow transition-all duration-300',
              )}
              aria-hidden
            >
              <Zap className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <span className="hidden font-bold text-lg tracking-tight text-foreground sm:block">
              Creator<span className="gradient-text">OS</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ───────────────────────────── */}
          <nav
            className="hidden flex-1 items-center gap-1 lg:flex"
            aria-label="Primary navigation"
            id="primary-nav"
          >
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  id={`nav-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'group relative flex items-center gap-2 px-3 py-2 rounded-md',
                    'text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'text-foreground bg-background-elevated'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-elevated/60',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'group-hover:text-primary',
                    )}
                    aria-hidden
                  />
                  {label}

                  {/* Active indicator */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right actions ───────────────────────────────── */}
          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <button
              type="button"
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg',
                'text-foreground-muted hover:text-foreground hover:bg-background-elevated',
                'transition-colors duration-150',
              )}
              aria-label="Notifications"
              id="nav-notifications"
            >
              <Bell className="h-4.5 w-4.5" aria-hidden />
              {/* Notification dot */}
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                aria-label="You have unread notifications"
              />
            </button>

            {/* Light/Dark Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                'text-foreground-muted hover:text-foreground hover:bg-background-elevated',
                'transition-colors duration-150',
              )}
              aria-label="Toggle light/dark theme"
              id="nav-theme-toggle"
            >
              {theme === 'dark' ? (
                <Sun className="h-4.5 w-4.5 text-amber-400" aria-hidden />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-400" aria-hidden />
              )}
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                'text-foreground-muted hover:text-foreground hover:bg-background-elevated',
                'transition-colors duration-150',
              )}
              aria-label="Settings"
              id="nav-settings"
            >
              <Settings className="h-4 w-4" aria-hidden />
            </Link>

            {/* User avatar */}
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5',
                'hover:bg-background-elevated transition-colors duration-150',
              )}
              aria-label="User menu"
              id="nav-user-menu"
              aria-haspopup="menu"
            >
              <div
                className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white"
                aria-hidden
              >
                C
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-foreground-muted hidden sm:block" aria-hidden />
            </button>

            {/* New Deal CTA — Primary action */}
            <Button
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 pl-3 pr-4"
              id="nav-new-deal-cta"
              aria-label="Create a new deal"
            >
              <Plus className="h-4 w-4" aria-hidden />
              New Deal
            </Button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg lg:hidden',
                'text-foreground-muted hover:text-foreground hover:bg-background-elevated',
                'transition-colors duration-150',
              )}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              id="nav-mobile-toggle"
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Overlay ────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={cn(
          'fixed top-16 left-0 right-0 z-40 lg:hidden',
          'bg-background/95 backdrop-blur-xl border-b border-border/50',
          'transition-all duration-300 ease-out',
          mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="mx-auto max-w-screen-sm px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon, description }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3',
                  'transition-all duration-150',
                  isActive
                    ? 'bg-primary-muted text-foreground'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-elevated',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                    isActive ? 'bg-primary/20 text-primary' : 'bg-background-elevated text-foreground-muted',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-foreground-subtle">{description}</p>
                </div>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                )}
              </Link>
            );
          })}

          {/* Mobile New Deal CTA */}
          <div className="mt-3 border-t border-border/50 pt-3">
            <Button variant="primary" size="default" className="w-full gap-2" id="mobile-new-deal-cta">
              <Plus className="h-4 w-4" aria-hidden />
              New Deal
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
