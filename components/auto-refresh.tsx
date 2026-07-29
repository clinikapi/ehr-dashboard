'use client';

// Bounded re-fetch for HealthLake's eventually-consistent search index.
//
// A resource written a moment ago is readable by ID immediately but takes
// ~10s to appear in search results (see lib/patients.ts). Rather than leave a
// stale page up until the user reloads by hand, the affected pages mount this
// and it re-runs the server render a few times, then stops.
//
// It is deliberately bounded: an unbounded poll on a server-rendered page is a
// traffic amplifier, and the window we're covering is seconds, not minutes.

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_INTERVAL_MS = 2500;
const DEFAULT_ATTEMPTS = 6;

/**
 * Imperative variant — for "I just wrote something, pull it back in when the
 * index catches up". Returns a `start()` that is safe to call repeatedly.
 */
export function useDelayedRefresh({
  intervalMs = DEFAULT_INTERVAL_MS,
  attempts = DEFAULT_ATTEMPTS,
}: { intervalMs?: number; attempts?: number } = {}) {
  const router = useRouter();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  return useCallback(() => {
    clear();
    for (let i = 1; i <= attempts; i += 1) {
      timers.current.push(setTimeout(() => router.refresh(), i * intervalMs));
    }
  }, [attempts, clear, intervalMs, router]);
}

/**
 * Declarative variant — mount it while a page knows it is showing
 * possibly-incomplete data; unmount (i.e. stop rendering it) once it isn't.
 */
export function AutoRefresh({
  intervalMs = DEFAULT_INTERVAL_MS,
  attempts = DEFAULT_ATTEMPTS,
}: { intervalMs?: number; attempts?: number }) {
  const router = useRouter();

  useEffect(() => {
    let fired = 0;
    const timer = setInterval(() => {
      fired += 1;
      router.refresh();
      if (fired >= attempts) clearInterval(timer);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [attempts, intervalMs, router]);

  return null;
}
