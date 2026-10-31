"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export interface DerivedUserProfile {
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Pure helper to derive displayName and avatarUrl from a real Supabase User.
 * Never fabricates a fallback user when `user` is null/undefined.
 */
export function deriveUserProfile(user: User | null | undefined): DerivedUserProfile {
  if (!user) {
    return {
      displayName: "",
      avatarUrl: null,
    };
  }

  const meta = user.user_metadata ?? {};
  const emailPrefix = user.email ? user.email.split("@")[0] : "";

  const displayName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    emailPrefix ||
    "";

  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url.trim()) ||
    (typeof meta.picture === "string" && meta.picture.trim()) ||
    null;

  return {
    displayName,
    avatarUrl,
  };
}

/**
 * Resolves the authenticated user strictly from the Supabase response.
 * Never reads cookies/localStorage or returns a fabricated demo user.
 */
export function resolveAuthenticatedUser(
  supabaseUser: User | null | undefined
): User | null {
  if (!supabaseUser || !supabaseUser.id) {
    return null;
  }
  return supabaseUser;
}

export function useAuth(initialUser?: User | null) {
  const [user, setUser] = useState<User | null>(() =>
    resolveAuthenticatedUser(initialUser)
  );
  const [loading, setLoading] = useState<boolean>(!initialUser);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchUser() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(resolveAuthenticatedUser(currentUser));
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(resolveAuthenticatedUser(session?.user ?? null));
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = Boolean(user);
  const { displayName, avatarUrl } = deriveUserProfile(user);

  const navigateProtected = (targetPath: string) => {
    if (isLoggedIn) {
      router.push(targetPath);
    } else {
      router.push("/sign-in");
    }
  };

  return {
    user,
    isLoggedIn,
    loading,
    displayName,
    avatarUrl,
    navigateProtected,
  };
}
