'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface GlowBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Position of the primary glow — adjusts radial gradient origin */
  glowPosition?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
  /** Intensity of the ambient glow */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** Show animated mesh gradient overlay */
  animated?: boolean;
}

const positionStyles = {
  'top-left':
    'radial-gradient(ellipse 80% 50% at 20% 10%, hsl(var(--primary-glow) / %opacity%) 0%, transparent 60%)',
  'top-right':
    'radial-gradient(ellipse 80% 50% at 80% 10%, hsl(var(--primary-glow) / %opacity%) 0%, transparent 60%)',
  center:
    'radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--primary-glow) / %opacity%) 0%, transparent 70%)',
  'bottom-left':
    'radial-gradient(ellipse 80% 50% at 20% 90%, hsl(var(--primary-glow) / %opacity%) 0%, transparent 60%)',
  'bottom-right':
    'radial-gradient(ellipse 80% 50% at 80% 90%, hsl(var(--primary-glow) / %opacity%) 0%, transparent 60%)',
};

const intensityOpacity = {
  subtle: '0.08',
  medium: '0.15',
  strong: '0.25',
};

export function GlowBackground({
  glowPosition = 'top-left',
  intensity = 'medium',
  animated = true,
  className,
  children,
  style,
  ...props
}: GlowBackgroundProps) {
  const opacity = intensityOpacity[intensity];
  const primaryGlow = positionStyles[glowPosition].replace('%opacity%', opacity);

  // Secondary accent glow — opposite corner
  const secondaryPos = glowPosition.includes('left') ? '80% 80%' : '20% 80%';
  const accentGlow = `radial-gradient(ellipse 60% 40% at ${secondaryPos}, hsl(var(--accent) / ${String(parseFloat(opacity) * 0.6)}) 0%, transparent 60%)`;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        animated && 'animate-[glow-pulse_8s_ease-in-out_infinite]',
        className,
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      {/* Glow layer — positioned absolutely behind content */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `${primaryGlow}, ${accentGlow}`,
        }}
      />

      {/* Noise texture overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
