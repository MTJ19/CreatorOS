"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import client from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { GradientPanel } from "@/components/GradientPanel";
import styles from "../../auth.module.css";

export default function CreatorSignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [niche, setNiche] = useState("");
  const [followerTier, setFollowerTier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: apiError } = await client.POST("/auth/creator/signup", {
      body: {
        display_name: displayName,
        instagram_handle: instagramHandle,
        niche,
        follower_tier: followerTier,
        email,
        password,
      },
    });
    setPending(false);
    if (apiError || !data) {
      setError("Couldn't create that account. Try again.");
      return;
    }
    saveSession(data);
    router.push("/creator");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.formCol}>
        <Link href="/" className={styles.logo}>Creator OS</Link>
        <div className={styles.formBody}>
          <p className={styles.eyebrow}>Creator</p>
          <h1 className={styles.headline}>Create your account</h1>
          <p className={styles.subline}>
            Already have an account? <Link href="/creator/login">Sign in</Link>
          </p>
          <p className={styles.subline}>
            You&apos;ll be able to link to any brand with an invite code once you&apos;re signed in.
          </p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                required
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="handle">Instagram handle</label>
                <input
                  id="handle"
                  required
                  placeholder="@yourhandle"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="tier">Follower tier</label>
                <input
                  id="tier"
                  required
                  placeholder="e.g. 50k–100k"
                  value={followerTier}
                  onChange={(e) => setFollowerTier(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="niche">Niche</label>
              <input
                id="niche"
                required
                placeholder="e.g. Beauty, Fitness, Tech"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className={styles.actionsRow}>
              <button type="submit" className={styles.btnPrimary} disabled={pending}>
                {pending ? "Creating account…" : "Create account"}
              </button>
              <Link href="/brand/signup" className={styles.linkMuted}>I&apos;m a brand</Link>
            </div>
          </form>
        </div>
      </div>
      <GradientPanel className={styles.art} />
    </div>
  );
}
