'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { RegisterSchema, type RegisterInput } from '@creator-os/shared';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await authApi.register(data);
      // Auto sign-in after register
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setServerError('Account created, but auto sign-in failed. Please log in.');
        router.push('/login');
        return;
      }
      router.push('/onboarding');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setServerError(msg.includes('already exists') ? 'This email is already registered.' : msg);
    }
  };

  const handleGoogle = () => {
    void signIn('google', { callbackUrl: '/onboarding' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Create your account</h1>
        <p className="text-sm text-foreground-muted">Start managing your brand deals like a pro</p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        className={cn(
          'mb-6 flex w-full items-center justify-center gap-3 px-4 py-3',
          'rounded-lg border border-border bg-background-elevated',
          'text-sm font-medium text-foreground',
          'transition-all duration-150 hover:border-border-strong hover:bg-background-overlay',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        id="google-register-btn"
        aria-label="Sign up with Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign up with Google
      </button>

      <div className="relative mb-6" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-foreground-subtle">or with email</span>
        </div>
      </div>

      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
          {serverError}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="register-name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            <input
              {...register('name')}
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Alex Creator"
              className={cn(
                'w-full rounded-lg border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground',
                'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
                'transition-all duration-150 focus:border-transparent',
                errors.name ? 'border-danger' : 'border-border',
              )}
            />
          </div>
          {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            <input
              {...register('email')}
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(
                'w-full rounded-lg border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground',
                'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
                'transition-all duration-150 focus:border-transparent',
                errors.email ? 'border-danger' : 'border-border',
              )}
            />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            <input
              {...register('password')}
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(
                'w-full rounded-lg border bg-input py-2.5 pl-10 pr-11 text-sm text-foreground',
                'placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring',
                'transition-all duration-150 focus:border-transparent',
                errors.password ? 'border-danger' : 'border-border',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password strength checklist */}
          {password.length > 0 && (
            <ul className="mt-2 space-y-1" aria-label="Password requirements">
              {passwordRules.map((rule) => {
                const passed = rule.test(password);
                return (
                  <li
                    key={rule.label}
                    className={cn(
                      'flex items-center gap-1.5 text-xs transition-colors',
                      passed ? 'text-success' : 'text-foreground-subtle',
                    )}
                  >
                    <Check className="h-3 w-3 flex-shrink-0" aria-hidden />
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-2 w-full gap-2"
          disabled={isSubmitting}
          id="register-submit-btn"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
          {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
