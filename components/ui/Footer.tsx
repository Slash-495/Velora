import Link from "next/link";
import { Container } from "./Container";

const footerLinks = {
  product: [
    { name: "Resume Studio", href: "/dashboard/resume-studio" },
    { name: "Job Application Tracker", href: "/dashboard/applications" },
    { name: "ATS Optimizer & Review", href: "/dashboard/resume-review" },
    { name: "AI Technical Screen Prep", href: "/dashboard/interview-prep" },
  ],
  templates: [
    { name: "Software Engineer", href: "/dashboard/templates" },
    { name: "Product Manager", href: "/dashboard/templates" },
    { name: "Data Analyst", href: "/dashboard/templates" },
    { name: "Executive & Design", href: "/dashboard/templates" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-background pt-16 pb-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary transition-transform duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg leading-none">V</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-text-primary">Velora</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-sm font-light">
              Your AI-powered career workspace built for job seekers. Build winning resumes, track job applications, analyze ATS scores, and practice mock technical screens.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit text-xs text-text-muted">
              <span>Proof of Concept & Portfolio Project</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4 text-sm">Product Features</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Templates Links */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4 text-sm">Resume Templates</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.templates.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs font-medium tracking-wide text-text-muted gap-4">
          <p>© {new Date().getFullYear()} Velora AI. Built with Next.js 15, React 19 & Supabase.</p>
          <div className="flex items-center gap-4 text-text-muted text-xs">
            <span>Portfolio Showcase</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
