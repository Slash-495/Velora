"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function AuthRedirectHandler() {
  useEffect(() => {
    const supabase = createClient();

    const redirectIfSession = (session: any) => {
      if (session?.user) {
        console.log("[AuthRedirectHandler] Active session verified, navigating to /dashboard...");
        window.location.href = "/dashboard";
      }
    };

    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectIfSession(session);
      }
    });

    // 2. Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        redirectIfSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
