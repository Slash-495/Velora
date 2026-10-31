"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Container } from "./Container";
import { signOut } from "@/app/(auth)/actions";
import { useAuth } from "@/hooks/use-auth";

export function Navbar({ user: initialUser }: { user?: any }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoggedIn } = useAuth(initialUser);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, navName: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (isLoggedIn) {
      switch (navName) {
        case "Features":
          router.push("/dashboard");
          break;
        case "Templates":
          router.push("/dashboard/resume-studio");
          break;
        case "Job Tracker":
          router.push("/dashboard/applications");
          break;
        case "AI Tools":
          router.push("/dashboard/resume-review");
          break;
        default:
          router.push("/dashboard");
      }
    } else {
      switch (navName) {
        case "Features":
        case "Templates":
        case "Job Tracker":
        case "AI Tools":
          const el = document.getElementById("features");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          } else {
            router.push("/#features");
          }
          break;
        default:
          router.push("/sign-in");
      }
    }
  };

  const navLinks = [
    { name: "Features" },
    { name: "Templates" },
    { name: "Job Tracker" },
    { name: "AI Tools" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-smooth ${
        isScrolled
          ? "py-3 bg-surface/70 backdrop-blur-xl border-b border-white/5 shadow-card-elevation"
          : "py-5 bg-transparent border-transparent"
      }`}
    >
      <Container className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary transition-transform duration-300 group-hover:scale-105">
            <span className="text-white font-bold text-lg leading-none">V</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-text-primary">Velora</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={(e) => handleNavClick(e, link.name)}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0"
            >
              {link.name}
            </button>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200">
                Dashboard
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200">
                Sign In
              </Link>
              <Link href="/sign-up" className="btn-glow py-2 px-4 text-sm rounded-xl">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            className="text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </Container>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 bg-surface/95 backdrop-blur-xl border-b border-white/5 shadow-card-elevation md:hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={(e) => handleNavClick(e, link.name)}
                  className="text-left text-base font-medium text-text-secondary hover:text-text-primary p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-0"
                >
                  {link.name}
                </button>
              ))}
              <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-center font-medium text-text-secondary hover:text-text-primary py-2 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <form action={signOut} className="flex flex-col">
                      <button 
                        type="submit"
                        className="text-center font-medium text-text-secondary hover:text-text-primary py-2 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Logout
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="text-center font-medium text-text-secondary hover:text-text-primary py-2 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="btn-glow w-full rounded-xl text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
