import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { createClient } from "@/utils/supabase/server";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Velora | Modern SaaS",
  description: "A clean and scalable SaaS foundation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-text-primary selection:bg-primary/30 selection:text-primary-glow flex flex-col min-h-screen`}>
        <LayoutWrapper user={user}>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
