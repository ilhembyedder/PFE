"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const DEFAULT_TIMEOUT = 15 * 60_000;
const WARNING_LEAD = 60_000;
const ACTIVITY = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "visibilitychange",
] as const;

/**
 * Automatic logout after inactivity (FR06 / NFR08).
 *
 * Warns one minute before, rather than logging out silently: a manager who
 * stepped away mid-case should be able to keep her session.
 *
 * The listener is registered once and reads its callbacks from a ref, so the
 * cleanup always removes the handler it added. The previous implementation
 * recreated the handler every render while registering only once, so removal
 * could silently no-op and leak listeners.
 */
export function useIdleLogout(enabled: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [warning, setWarning] = useState(false);
  const timers = useRef<{ warn?: ReturnType<typeof setTimeout>; out?: ReturnType<typeof setTimeout> }>({});

  const timeout = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT) || DEFAULT_TIMEOUT;

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      queryClient.clear();
      router.replace("/login?expired=1");
      router.refresh();
    }
  }, [queryClient, router]);

  const schedule = useCallback(() => {
    clearTimeout(timers.current.warn);
    clearTimeout(timers.current.out);
    setWarning(false);

    timers.current.warn = setTimeout(
      () => setWarning(true),
      Math.max(timeout - WARNING_LEAD, 0),
    );
    timers.current.out = setTimeout(() => void logout(), timeout);
  }, [timeout, logout]);

  // Held in a ref so the effect below can depend on nothing that changes.
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  useEffect(() => {
    if (!enabled) return;

    // Captured here so cleanup clears the very handles this effect created,
    // not whatever the ref happens to hold when it runs.
    const handles = timers.current;
    const onActivity = () => scheduleRef.current();
    scheduleRef.current();

    for (const event of ACTIVITY) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY) {
        window.removeEventListener(event, onActivity);
      }
      clearTimeout(handles.warn);
      clearTimeout(handles.out);
    };
  }, [enabled]);

  return {
    warning,
    stayConnected: () => scheduleRef.current(),
    logout,
  };
}
