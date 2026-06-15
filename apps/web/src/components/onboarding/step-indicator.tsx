'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress" className={cn('w-full', className)}>
      <ol className="flex items-center gap-0">
        {steps.map((step, idx) => {
          const status =
            currentStep > step.number
              ? 'complete'
              : currentStep === step.number
                ? 'active'
                : 'upcoming';

          return (
            <li key={step.number} className="flex flex-1 items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    'ring-2 transition-all duration-300',
                    status === 'complete' &&
                      'bg-primary ring-primary text-white shadow-glow-sm',
                    status === 'active' &&
                      'bg-primary/20 ring-primary text-primary animate-[glow-pulse_3s_ease-in-out_infinite]',
                    status === 'upcoming' &&
                      'bg-background-elevated ring-border text-foreground-subtle',
                  )}
                  aria-current={status === 'active' ? 'step' : undefined}
                  aria-label={`Step ${step.number}: ${step.label} — ${status}`}
                >
                  {status === 'complete' ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <span aria-hidden>{step.number}</span>
                  )}
                </div>

                {/* Label — only visible on sm+ */}
                <span
                  className={cn(
                    'hidden sm:block text-xs font-medium whitespace-nowrap transition-colors',
                    status === 'active' ? 'text-primary' : 'text-foreground-subtle',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mb-5 sm:mb-6 rounded-full transition-all duration-500',
                    currentStep > step.number
                      ? 'bg-gradient-to-r from-primary to-accent'
                      : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
