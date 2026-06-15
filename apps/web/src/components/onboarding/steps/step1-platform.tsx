/* eslint-disable */
'use client';

import { useFormContext } from 'react-hook-form';
import {
  Instagram,
  Youtube,
  Music2,
  Twitter,
  Linkedin,
  Twitch,
  Radio,
  BookOpen,
  Users,
} from 'lucide-react';
import type { SocialPlatform } from '@creator-os/shared';
import { cn } from '@/lib/utils';

const PLATFORMS: {
  value: SocialPlatform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-orange-400' },
  { value: 'YOUTUBE', label: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-400' },
  { value: 'TIKTOK', label: 'TikTok', icon: Music2, color: 'from-slate-100 to-slate-300' },
  { value: 'TWITTER', label: 'X / Twitter', icon: Twitter, color: 'from-sky-400 to-blue-500' },
  { value: 'LINKEDIN', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-400' },
  { value: 'TWITCH', label: 'Twitch', icon: Twitch, color: 'from-purple-500 to-violet-400' },
  { value: 'PODCAST', label: 'Podcast', icon: Radio, color: 'from-amber-400 to-orange-400' },
  { value: 'PINTEREST', label: 'Pinterest', icon: BookOpen, color: 'from-rose-500 to-pink-400' },
];

export function Step1Platform() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const primaryPlatform = watch('primaryPlatform') as SocialPlatform | undefined;
  const handle = watch('platformHandles.0.handle') as string | undefined;

  return (
    <div className="space-y-6">
      {/* Primary Platform Picker */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Primary platform{' '}
          <span className="text-danger" aria-hidden>
            *
          </span>
        </label>
        <div
          className="grid grid-cols-4 gap-2.5"
          role="radiogroup"
          aria-label="Select your primary platform"
        >
          {PLATFORMS.map(({ value, label, icon: Icon, color }) => {
            const isSelected = primaryPlatform === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={label}
                onClick={() => {
                  setValue('primaryPlatform', value, { shouldValidate: true });
                  setValue('platformHandles.0.platform', value);
                  if (!watch('platformHandles.0.followerCount')) {
                    setValue('platformHandles.0.followerCount', 0);
                    setValue('platformHandles.0.verified', false);
                  }
                }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary-muted shadow-glow-sm ring-1 ring-primary'
                    : 'border-border bg-background-elevated hover:border-border-strong hover:bg-background-overlay',
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br',
                    color,
                  )}
                >
                  <Icon className="h-5 w-5 text-white" aria-hidden />
                </div>
                <span className="text-center text-xs font-medium leading-tight text-foreground">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.primaryPlatform && (
          <p className="text-xs text-danger">{String(errors.primaryPlatform.message)}</p>
        )}
      </div>

      {/* Handle input */}
      <div className="space-y-1.5">
        <label htmlFor="platform-handle" className="text-sm font-medium text-foreground">
          {primaryPlatform
            ? `${PLATFORMS.find((p) => p.value === primaryPlatform)?.label} handle`
            : 'Handle'}
          <span className="ml-1 text-danger" aria-hidden>
            *
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-foreground-muted">
            @
          </span>
          <input
            {...register('platformHandles.0.handle')}
            id="platform-handle"
            type="text"
            placeholder="yourchannel"
            autoComplete="off"
            className={cn(
              'w-full rounded-lg border bg-input py-2.5 pl-8 pr-4 text-sm text-foreground',
              'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
              'transition-all duration-150 focus:border-transparent',
              errors.platformHandles ? 'border-danger' : 'border-border',
            )}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="total-followers" className="text-sm font-medium text-foreground">
            Total followers
          </label>
          <input
            {...register('totalFollowers', { valueAsNumber: true })}
            id="total-followers"
            type="number"
            min="0"
            placeholder="50000"
            className={cn(
              'w-full rounded-lg border bg-input px-3 py-2.5 text-sm text-foreground',
              'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
              'border-border transition-all duration-150 focus:border-transparent',
            )}
          />
          <p className="text-xs text-foreground-subtle">Combined across platforms</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="avg-views" className="text-sm font-medium text-foreground">
            Avg. views per post
          </label>
          <input
            {...register('avgViews', { valueAsNumber: true })}
            id="avg-views"
            type="number"
            min="0"
            placeholder="10000"
            className={cn(
              'w-full rounded-lg border bg-input px-3 py-2.5 text-sm text-foreground',
              'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
              'border-border transition-all duration-150 focus:border-transparent',
            )}
          />
        </div>
      </div>

      {/* Hidden required field for RHF */}
      <input type="hidden" {...register('platformHandles.0.platform')} />
      <input
        type="hidden"
        {...register('platformHandles.0.followerCount', { valueAsNumber: true })}
        value={watch('totalFollowers') ?? 0}
      />
      <input type="hidden" {...register('platformHandles.0.verified')} value="false" />
    </div>
  );
}
