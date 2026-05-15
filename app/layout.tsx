import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Velora | Modern SaaS",
  description: "A clean and scalable SaaS foundation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-text-primary selection:bg-primary/30 selection:text-primary-glow flex flex-col min-h-screen`}>
        <Navbar />
        <div className="flex-1 pt-24">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
