import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { createClient } from "@/utils/supabase/server";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Velora | AI-Powered Resume Builder & Job Application Tracker",
  description: "Velora: AI-powered resume builder and job tracker.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Velora | AI-Powered Resume Builder & Job Application Tracker",
    description: "Velora: AI-powered resume builder and job tracker.",
    type: "website",
    siteName: "Velora",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velora | AI-Powered Resume Builder & Job Application Tracker",
    description: "Velora: AI-powered resume builder and job tracker.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser || null;
  } catch {
    user = null;
  }

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
