"use client";

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
