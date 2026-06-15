/* eslint-disable */
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import {
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  OnboardingStep3Schema,
  OnboardingStep4Schema,
  type OnboardingStep1Input,
  type OnboardingStep2Input,
  type OnboardingStep3Input,
  type OnboardingStep4Input,
} from '@creator-os/shared';
import { StepIndicator } from './step-indicator';
import { Step1Platform } from './steps/step1-platform';
import { Step2Content } from './steps/step2-content';
import { Step3Audience } from './steps/step3-audience';
import { Step4Rates } from './steps/step4-rates';
import { Button } from '@/components/ui/button';
import { GlowBackground } from '@/components/ui/glow-background';
import { profileApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const STEPS = [
  { number: 1, label: 'Platform', description: 'Your social presence' },
  { number: 2, label: 'Content', description: 'Niche & formats' },
  { number: 3, label: 'Audience', description: 'Who follows you' },
  { number: 4, label: 'Rates', description: 'Pricing & bio' },
];

const STEP_SCHEMAS = [
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  OnboardingStep3Schema,
  OnboardingStep4Schema,
];

type AllStepsData = OnboardingStep1Input &
  OnboardingStep2Input &
  OnboardingStep3Input &
  OnboardingStep4Input;

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

export function OnboardingWizard() {
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedData, setSavedData] = useState<Partial<AllStepsData>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const currentSchema = STEP_SCHEMAS[step - 1];
  const methods = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(currentSchema as any),
    defaultValues: savedData,
    mode: 'onTouched',
  });

  const accessToken = (session as typeof session & { accessToken?: string })?.accessToken;

  const goNext = methods.handleSubmit(async (data) => {
    const merged = { ...savedData, ...data };
    setSavedData(merged);

    // Save progress to API on each step
    if (accessToken) {
      await profileApi.upsert(accessToken, merged as Record<string, unknown>).catch(() => null);
    }

    if (step < STEPS.length) {
      setDirection(1);
      setStep((s) => s + 1);
      methods.reset({ ...merged });
    } else {
      // Final submit
      setIsSubmitting(true);
      setServerError(null);
      try {
        if (accessToken) {
          await profileApi.upsert(accessToken, { ...merged, isOnboardingComplete: true });
          await profileApi.completeOnboarding(accessToken);
        }
        router.push('/dashboard');
        router.refresh();
      } catch (err: unknown) {
        setServerError(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        );
        setIsSubmitting(false);
      }
    }
  });

  const goBack = () => {
    if (step > 1) {
      setSavedData((prev) => ({ ...prev, ...methods.getValues() }));
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <GlowBackground glowPosition="top-left" intensity="medium" animated />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12">
        {/* ── Hero header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-muted/50 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="text-xs font-medium text-primary">
              Setting up your CreatorOS profile
            </span>
          </div>
          <h1 className="mb-2 text-4xl font-bold text-foreground">
            Welcome to <span className="gradient-text">DEALOS</span>
          </h1>
          <p className="text-foreground-muted">
            Complete your profile to unlock AI-powered deal management
          </p>
        </motion.div>

        {/* ── Step indicator ───────────────────────────────────── */}
        <StepIndicator steps={STEPS} currentStep={step} className="mb-8" />

        {/* ── Step card ────────────────────────────────────────── */}
        <div
          className={cn(
            'rounded-2xl border border-border/60 bg-background-surface/80',
            'overflow-hidden shadow-float-lg backdrop-blur-xl',
          )}
        >
          {/* Step header */}
          <div className="border-b border-border/40 px-6 pb-4 pt-6">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-muted">
                <span className="text-sm font-bold text-primary">{step}</span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                  Step {step} of {STEPS.length}
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                  {STEPS[step - 1]?.label} — {STEPS[step - 1]?.description}
                </h2>
              </div>
            </motion.div>
          </div>

          {/* Step content with Framer Motion transitions */}
          <FormProvider {...methods}>
            <form onSubmit={goNext} noValidate>
              <div className="min-h-[420px] px-6 py-6">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
                  >
                    {step === 1 && <Step1Platform />}
                    {step === 2 && <Step2Content />}
                    {step === 3 && <Step3Audience />}
                    {step === 4 && <Step4Rates />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {serverError && (
                <div className="mx-6 mb-4 rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger">
                  {serverError}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 px-6 pb-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="default"
                  onClick={goBack}
                  disabled={step === 1 || isSubmitting}
                  className="gap-2"
                  id="onboarding-back-btn"
                  aria-label="Go to previous step"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back
                </Button>

                <div className="flex items-center gap-3">
                  {/* Dot progress */}
                  <div className="flex gap-1.5" aria-hidden>
                    {STEPS.map((s) => (
                      <div
                        key={s.number}
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-300',
                          step === s.number
                            ? 'w-6 bg-primary'
                            : step > s.number
                              ? 'w-1.5 bg-primary/50'
                              : 'w-1.5 bg-border',
                        )}
                      />
                    ))}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="default"
                    disabled={isSubmitting}
                    className="min-w-[120px] gap-2"
                    id="onboarding-next-btn"
                    aria-label={step < STEPS.length ? 'Continue to next step' : 'Complete setup'}
                  >
                    {isSubmitting ? 'Saving…' : step < STEPS.length ? 'Continue' : 'Complete Setup'}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden />}
                  </Button>
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
