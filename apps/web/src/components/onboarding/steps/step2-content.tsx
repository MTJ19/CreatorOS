'use client';

import { useFormContext } from 'react-hook-form';
import type { ContentFormat, PostingFrequency } from '@creator-os/shared';
import { cn } from '@/lib/utils';

const NICHES = [
  'Fashion & Beauty', 'Fitness & Health', 'Food & Cooking', 'Travel', 'Tech & Gaming',
  'Business & Finance', 'Education', 'Lifestyle', 'Music & Entertainment', 'Sports',
  'Parenting', 'Home & DIY', 'Sustainability', 'Art & Design', 'Comedy & Memes',
];

const CONTENT_FORMATS: { value: ContentFormat; label: string; emoji: string }[] = [
  { value: 'SHORT_FORM_VIDEO', label: 'Short-form Video', emoji: '🎬' },
  { value: 'LONG_FORM_VIDEO', label: 'Long-form Video', emoji: '📹' },
  { value: 'STATIC_IMAGE', label: 'Static Image', emoji: '🖼️' },
  { value: 'CAROUSEL', label: 'Carousel', emoji: '🎠' },
  { value: 'STORIES', label: 'Stories', emoji: '⭕' },
  { value: 'LIVE_STREAM', label: 'Live Stream', emoji: '🔴' },
  { value: 'PODCAST', label: 'Podcast', emoji: '🎙️' },
  { value: 'BLOG_ARTICLE', label: 'Blog / Article', emoji: '📝' },
  { value: 'NEWSLETTER', label: 'Newsletter', emoji: '📧' },
  { value: 'UGC_RAW_FOOTAGE', label: 'UGC / Raw Footage', emoji: '📱' },
];

const FREQUENCIES: { value: PostingFrequency; label: string; sub: string }[] = [
  { value: 'DAILY', label: 'Daily', sub: '7+ times/week' },
  { value: 'MULTIPLE_WEEKLY', label: 'Multiple/week', sub: '3–6 times/week' },
  { value: 'WEEKLY', label: 'Weekly', sub: '~1 time/week' },
  { value: 'BIWEEKLY', label: 'Biweekly', sub: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly', sub: '~1 time/month' },
  { value: 'LESS_THAN_MONTHLY', label: 'Occasionally', sub: 'Less than monthly' },
];

export function Step2Content() {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const selectedNiches = (watch('niche') as string[]) ?? [];
  const selectedFormats = (watch('contentFormats') as ContentFormat[]) ?? [];
  const selectedFrequency = watch('postingFrequency') as PostingFrequency | undefined;

  const toggleNiche = (niche: string) => {
    if (selectedNiches.includes(niche)) {
      setValue('niche', selectedNiches.filter((n) => n !== niche), { shouldValidate: true });
    } else if (selectedNiches.length < 5) {
      setValue('niche', [...selectedNiches, niche], { shouldValidate: true });
    }
  };

  const toggleFormat = (format: ContentFormat) => {
    if (selectedFormats.includes(format)) {
      setValue('contentFormats', selectedFormats.filter((f) => f !== format), { shouldValidate: true });
    } else {
      setValue('contentFormats', [...selectedFormats, format], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Niche */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Your niche(s) <span className="text-danger" aria-hidden>*</span>
          </label>
          <span className="text-xs text-foreground-subtle">
            {selectedNiches.length}/5 selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Select your niches">
          {NICHES.map((niche) => {
            const isSelected = selectedNiches.includes(niche);
            const isDisabled = !isSelected && selectedNiches.length >= 5;
            return (
              <button
                key={niche}
                type="button"
                aria-pressed={isSelected}
                disabled={isDisabled}
                onClick={() => toggleNiche(niche)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-primary-muted border-primary text-primary shadow-glow-sm'
                    : isDisabled
                      ? 'border-border text-foreground-subtle opacity-40 cursor-not-allowed'
                      : 'border-border bg-background-elevated text-foreground-muted hover:border-border-strong hover:text-foreground',
                )}
              >
                {niche}
              </button>
            );
          })}
        </div>
        {errors.niche && (
          <p className="text-xs text-danger">{String(errors.niche.message)}</p>
        )}
      </div>

      {/* Content formats */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Content formats <span className="text-danger" aria-hidden>*</span>
        </label>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Select content formats">
          {CONTENT_FORMATS.map(({ value, label, emoji }) => {
            const isSelected = selectedFormats.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleFormat(value)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm text-left',
                  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-primary-muted border-primary text-foreground shadow-glow-sm'
                    : 'bg-background-elevated border-border text-foreground-muted hover:border-border-strong hover:text-foreground',
                )}
              >
                <span className="text-base flex-shrink-0" aria-hidden>{emoji}</span>
                <span className="font-medium text-xs">{label}</span>
              </button>
            );
          })}
        </div>
        {errors.contentFormats && (
          <p className="text-xs text-danger">{String(errors.contentFormats.message)}</p>
        )}
      </div>

      {/* Posting frequency */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Posting frequency <span className="text-danger" aria-hidden>*</span>
        </label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How often do you post?">
          {FREQUENCIES.map(({ value, label, sub }) => {
            const isSelected = selectedFrequency === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setValue('postingFrequency', value, { shouldValidate: true })}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-3 rounded-lg border text-center',
                  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-primary-muted border-primary shadow-glow-sm'
                    : 'bg-background-elevated border-border hover:border-border-strong',
                )}
              >
                <span className={cn('text-xs font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                  {label}
                </span>
                <span className="text-xs text-foreground-subtle">{sub}</span>
              </button>
            );
          })}
        </div>
        {errors.postingFrequency && (
          <p className="text-xs text-danger">{String(errors.postingFrequency.message)}</p>
        )}
      </div>
    </div>
  );
}
