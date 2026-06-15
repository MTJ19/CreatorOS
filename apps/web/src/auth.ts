/* eslint-disable */
/**
 * NextAuth v5 (Auth.js) configuration
 * Credentials provider calls NestJS API; Google OAuth exchanges token for NestJS JWT.
 */
import NextAuth, { type NextAuthConfig, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { LoginSchema } from '@creator-os/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const config = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
          });

          if (!res.ok) return null;

          const data = (await res.json()) as {
            user: { id: string; email: string; name: string; role: string; avatarUrl?: string };
            tokens: { accessToken: string; refreshToken: string; expiresIn: number };
          };

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            image: data.user.avatarUrl ?? null,
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            accessTokenExpiry: Date.now() + data.tokens.expiresIn * 1000,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpiry = user.accessTokenExpiry;
      }

      if (account?.provider === 'google' && account.access_token) {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleToken: account.access_token,
              email: token.email,
              name: token.name,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              user: { id: string; role: string };
              tokens: { accessToken: string; refreshToken: string; expiresIn: number };
            };
            token.sub = data.user.id;
            token.role = data.user.role;
            token.accessToken = data.tokens.accessToken;
            token.refreshToken = data.tokens.refreshToken;
            token.accessTokenExpiry = Date.now() + data.tokens.expiresIn * 1000;
          }
        } catch {
          // Keep token as-is if API call fails
        }
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub && session.user) session.user.id = token.sub;
      (session as any).accessToken = token.accessToken;
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;

const nextAuth = NextAuth(config);

// Named exports to avoid TS2742 portability issue with next-auth beta
export const handlers: typeof nextAuth.handlers = nextAuth.handlers;
export const auth: typeof nextAuth.auth = nextAuth.auth;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut;
