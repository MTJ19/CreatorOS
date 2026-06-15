'use client';

import { useFormContext } from 'react-hook-form';
import type { AudienceAgeRange } from '@creator-os/shared';
import { cn } from '@/lib/utils';

// ISO 3166-1 alpha-2 country codes + names (top 25 creator markets)
const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
];

const AGE_RANGES: { value: AudienceAgeRange; label: string; widthClass: string }[] = [
  { value: 'AGE_13_17', label: '13–17', widthClass: 'w-12' },
  { value: 'AGE_18_24', label: '18–24', widthClass: 'w-20' },
  { value: 'AGE_25_34', label: '25–34', widthClass: 'w-24' },
  { value: 'AGE_35_44', label: '35–44', widthClass: 'w-20' },
  { value: 'AGE_45_54', label: '45–54', widthClass: 'w-14' },
  { value: 'AGE_55_PLUS', label: '55+', widthClass: 'w-10' },
];

export function Step3Audience() {
  const { watch, setValue, register, formState: { errors } } = useFormContext();
  const selectedCountries = (watch('audienceGeography') as string[]) ?? [];
  const selectedAges = (watch('audienceAgeRange') as AudienceAgeRange[]) ?? [];

  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      setValue('audienceGeography', selectedCountries.filter((c) => c !== code), { shouldValidate: true });
    } else {
      setValue('audienceGeography', [...selectedCountries, code], { shouldValidate: true });
    }
  };

  const toggleAge = (range: AudienceAgeRange) => {
    if (selectedAges.includes(range)) {
      setValue('audienceAgeRange', selectedAges.filter((a) => a !== range), { shouldValidate: true });
    } else {
      setValue('audienceAgeRange', [...selectedAges, range], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Audience geography */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Audience geography <span className="text-danger" aria-hidden>*</span>
          </label>
          <span className="text-xs text-foreground-subtle">
            {selectedCountries.length} selected
          </span>
        </div>
        <div
          className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin"
          role="group"
          aria-label="Select audience countries"
        >
          {COUNTRIES.map(({ code, name, flag }) => {
            const isSelected = selectedCountries.includes(code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={isSelected}
                aria-label={name}
                onClick={() => toggleCountry(code)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium',
                  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-primary-muted border-primary text-foreground shadow-glow-sm'
                    : 'bg-background-elevated border-border text-foreground-muted hover:border-border-strong hover:text-foreground',
                )}
              >
                <span aria-hidden>{flag}</span>
                <span>{code}</span>
              </button>
            );
          })}
        </div>
        {errors.audienceGeography && (
          <p className="text-xs text-danger">{String(errors.audienceGeography.message)}</p>
        )}
      </div>

      {/* Age range — visual bar picker */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Audience age ranges <span className="text-danger" aria-hidden>*</span>
        </label>
        <div
          className="flex items-end gap-3 pt-2"
          role="group"
          aria-label="Select audience age ranges"
        >
          {AGE_RANGES.map(({ value, label, widthClass }) => {
            const isSelected = selectedAges.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleAge(value)}
                className="flex flex-col items-center gap-2 group focus-visible:outline-none"
              >
                <div
                  className={cn(
                    'rounded-t-md transition-all duration-200',
                    widthClass,
                    isSelected ? 'bg-primary shadow-glow-sm' : 'bg-background-elevated border border-border',
                  )}
                  style={{ height: value === 'AGE_25_34' ? 80 : value === 'AGE_18_24' || value === 'AGE_35_44' ? 60 : 40 }}
                  aria-hidden
                />
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isSelected ? 'text-primary' : 'text-foreground-subtle',
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.audienceAgeRange && (
          <p className="text-xs text-danger">{String(errors.audienceAgeRange.message)}</p>
        )}
      </div>

      {/* Engagement rate */}
      <div className="space-y-1.5">
        <label htmlFor="engagement-rate" className="text-sm font-medium text-foreground">
          Avg. engagement rate <span className="text-foreground-subtle text-xs font-normal">(optional)</span>
        </label>
        <div className="relative">
          <input
            {...register('avgEngagementRate', { valueAsNumber: true })}
            id="engagement-rate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="3.5"
            className={cn(
              'w-full px-3 pr-8 py-2.5 rounded-lg text-sm bg-input border text-foreground',
              'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
              'focus:border-transparent transition-all duration-150 border-border',
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm select-none">%</span>
        </div>
        <p className="text-xs text-foreground-subtle">
          Likes + comments ÷ followers × 100. Leave blank if unsure.
        </p>
      </div>
    </div>
  );
}
