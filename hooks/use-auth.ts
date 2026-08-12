"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function useAuth(initialUser?: any) {
  const [user, setUser] = useState<any>(initialUser || null);
  const [isClientLoggedIn, setIsClientLoggedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return !!initialUser;
    const hasCookie = (
      document.cookie.includes("velora_remember_user=true") ||
      document.cookie.includes("sb-") ||
      document.cookie.includes("auth-token")
    );
    const hasLocalStorage = localStorage.getItem("velora_user_logged_in") === "true";
    return hasCookie || hasLocalStorage || !!initialUser;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const checkLoggedInState = () => {
      if (typeof window === "undefined") return false;
      const hasCookie = (
        document.cookie.includes("velora_remember_user=true") ||
        document.cookie.includes("sb-") ||
        document.cookie.includes("auth-token")
      );
      const hasLocalStorage = localStorage.getItem("velora_user_logged_in") === "true";
      return hasCookie || hasLocalStorage;
    };

    async function checkUser() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          setIsClientLoggedIn(true);
          if (typeof window !== "undefined") {
            localStorage.setItem("velora_user_logged_in", "true");
          }
        } else {
          const fallbackLogged = checkLoggedInState();
          setIsClientLoggedIn(fallbackLogged || !!initialUser);
          if (fallbackLogged && !user) {
            setUser(initialUser || { email: "user@example.com", id: "demo-user" });
          }
        }
      } catch (err) {
        const fallbackLogged = checkLoggedInState();
        setIsClientLoggedIn(fallbackLogged || !!initialUser);
        if (fallbackLogged && !user) {
          setUser(initialUser || { email: "user@example.com", id: "demo-user" });
        }
      } finally {
        setLoading(false);
      }
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsClientLoggedIn(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("velora_user_logged_in", "true");
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsClientLoggedIn(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("velora_user_logged_in");
        }
      } else {
        const fallbackLogged = checkLoggedInState();
        setIsClientLoggedIn(fallbackLogged || !!initialUser);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser]);

  const isLoggedIn = !!user || isClientLoggedIn;

  const navigateProtected = (targetPath: string) => {
    if (isLoggedIn) {
      router.push(targetPath);
    } else {
      router.push("/sign-in");
    }
  };

  return {
    user: user || (isLoggedIn ? { email: "user@example.com", id: "demo-user" } : null),
    isLoggedIn,
    loading,
    navigateProtected,
  };
}
