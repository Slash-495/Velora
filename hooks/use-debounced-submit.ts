"use client";

import { useState, useRef, useCallback } from "react";

interface UseDebouncedSubmitOptions {
  debounceMs?: number;
}

/**
 * Custom hook to debounce generate buttons and prevent users from firing multiple parallel requests.
 */
export function useDebouncedSubmit<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: UseDebouncedSubmitOptions = {}
) {
  const { debounceMs = 1000 } = options;
  const [isPending, setIsPending] = useState(false);
  const lastSubmitTimeRef = useRef<number>(0);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      const now = Date.now();
      if (now - lastSubmitTimeRef.current < debounceMs) {
        console.warn("[Debounce] Click ignored: Action fired too rapidly.");
        return undefined;
      }

      if (isPending) {
        console.warn("[Debounce] Click ignored: Previous generation is still in progress.");
        return undefined;
      }

      lastSubmitTimeRef.current = now;
      setIsPending(true);

      try {
        const result = await asyncFn(...args);
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [asyncFn, debounceMs, isPending]
  );

  return {
    execute,
    isPending
  };
}
