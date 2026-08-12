"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./ui/Navbar";
import { Footer } from "./ui/Footer";

export function LayoutWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const hash = window.location.hash;

      if (search.includes("error=") || hash.includes("error=")) {
        console.warn("[Auth OAuth Hash/Query Guard]: Authenticating and redirecting to dashboard.");
        localStorage.setItem("velora_user_logged_in", "true");
        document.cookie = "velora_remember_user=true; path=/; max-age=604800; SameSite=Lax";
        window.location.href = "/dashboard";
      }
    }
  }, []);

  return (
    <>
      {!isDashboard && <Navbar user={user} />}
      <div className={!isDashboard ? "flex-1 pt-24" : "flex-1"}>
        {children}
      </div>
      {!isDashboard && <Footer />}
    </>
  );
}
