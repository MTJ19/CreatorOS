'use client';

import { useFormContext } from 'react-hook-form';
import { DollarSign, Globe, FileText, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
];

export function Step4Rates() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const selectedCurrency = (watch('currency') as string) ?? 'USD';
  const currencySymbol = CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol ?? '$';

  return (
    <div className="space-y-6">
      {/* Base rate + currency */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Base rate per post{' '}
          <span className="text-xs font-normal text-foreground-subtle">(optional)</span>
        </label>
        <div className="flex gap-3">
          {/* Currency selector */}
          <div className="w-36 flex-shrink-0">
            <select
              value={selectedCurrency}
              onChange={(e) => setValue('currency', e.target.value)}
              id="currency-select"
              aria-label="Select currency"
              className={cn(
                'w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground',
                'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring',
                'cursor-pointer transition-all duration-150',
              )}
            >
              {CURRENCIES.map(({ code, symbol, label }) => (
                <option key={code} value={code}>
                  {symbol} {code} — {label}
                </option>
              ))}
            </select>
          </div>

          {/* Rate input */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-foreground-muted">
              {currencySymbol}
            </span>
            <input
              {...register('baseRate', { valueAsNumber: true })}
              id="base-rate"
              type="number"
              min="0"
              step="0.01"
              placeholder="1,500"
              className={cn(
                'w-full rounded-lg border bg-input py-2.5 pl-8 pr-4 text-sm text-foreground',
                'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
                'transition-all duration-150 focus:border-transparent',
                errors.baseRate ? 'border-danger' : 'border-border',
              )}
            />
          </div>
        </div>
        <p className="text-xs text-foreground-subtle">
          Your starting rate for a sponsored post. Brands will see this as a baseline.
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label htmlFor="creator-bio" className="text-sm font-medium text-foreground">
          <FileText className="mr-1.5 inline h-3.5 w-3.5 text-foreground-muted" aria-hidden />
          Creator bio <span className="text-xs font-normal text-foreground-subtle">(optional)</span>
        </label>
        <textarea
          {...register('bio')}
          id="creator-bio"
          rows={4}
          maxLength={2000}
          placeholder="Tell brands about yourself, your content style, and what makes your audience unique…"
          className={cn(
            'w-full resize-none rounded-lg border bg-input px-3 py-2.5 text-sm text-foreground',
            'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
            'transition-all duration-150 focus:border-transparent',
            errors.bio ? 'border-danger' : 'border-border',
          )}
        />
        <p className="text-right text-xs text-foreground-subtle">
          {(watch('bio') as string | undefined)?.length ?? 0}/2000
        </p>
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="creator-location" className="text-sm font-medium text-foreground">
            <MapPin className="mr-1.5 inline h-3.5 w-3.5 text-foreground-muted" aria-hidden />
            Location <span className="text-xs font-normal text-foreground-subtle">(optional)</span>
          </label>
          <input
            {...register('location')}
            id="creator-location"
            type="text"
            placeholder="New York, USA"
            className={cn(
              'w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground',
              'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
              'transition-all duration-150 focus:border-transparent',
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="creator-website" className="text-sm font-medium text-foreground">
            <Globe className="mr-1.5 inline h-3.5 w-3.5 text-foreground-muted" aria-hidden />
            Website <span className="text-xs font-normal text-foreground-subtle">(optional)</span>
          </label>
          <input
            {...register('website')}
            id="creator-website"
            type="url"
            placeholder="https://yoursite.com"
            className={cn(
              'w-full rounded-lg border bg-input px-3 py-2.5 text-sm text-foreground',
              'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
              'transition-all duration-150 focus:border-transparent',
              errors.website ? 'border-danger' : 'border-border',
            )}
          />
          {errors.website && (
            <p className="text-xs text-danger">{String(errors.website.message)}</p>
          )}
        </div>
      </div>

      {/* Preview banner */}
      <div className="rounded-lg border border-primary/20 bg-primary-muted/30 p-4">
        <div className="flex items-start gap-3">
          <DollarSign className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">You&apos;re almost done! 🎉</p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              After setup, you can always update your rates, manage active deals, track performance,
              and send invoices from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
