'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { LoginSchema, type LoginInput } from '@creator-os/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError('Invalid email or password. Please try again.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  const handleGoogle = () => {
    void signIn('google', { callbackUrl });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-foreground-muted">Sign in to manage your creator deals</p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        className={cn(
          'mb-6 flex w-full items-center justify-center gap-3 px-4 py-3',
          'rounded-lg border border-border bg-background-elevated',
          'text-sm font-medium text-foreground',
          'hover:border-border-strong hover:bg-background-overlay',
          'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        id="google-signin-btn"
        aria-label="Continue with Google"
      >
        {/* Google icon */}
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
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-6" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-foreground-subtle">or continue with email</span>
        </div>
      </div>

      {/* Error */}
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            <input
              {...register('email')}
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(
                'w-full rounded-lg py-2.5 pl-10 pr-4 text-sm',
                'border bg-input text-foreground placeholder:text-foreground-subtle',
                'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring',
                'transition-all duration-150',
                errors.email ? 'border-danger focus:ring-danger' : 'border-border',
              )}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="text-xs text-danger" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary transition-colors hover:text-primary-hover"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            <input
              {...register('password')}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'w-full rounded-lg py-2.5 pl-10 pr-11 text-sm',
                'border bg-input text-foreground placeholder:text-foreground-subtle',
                'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring',
                'transition-all duration-150',
                errors.password ? 'border-danger focus:ring-danger' : 'border-border',
              )}
              aria-invalid={!!errors.password}
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
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-2 w-full gap-2"
          disabled={isSubmitting}
          id="login-submit-btn"
          aria-label="Sign in to your account"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
          {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Create one free
        </Link>
      </p>
    </motion.div>
  );
}
