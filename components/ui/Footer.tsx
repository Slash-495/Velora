import Link from "next/link";
import { Container } from "./Container";

const footerLinks = {
  product: [
    { name: "Resume Builder", href: "#" },
    { name: "Job Tracker", href: "#" },
    { name: "ATS Optimizer", href: "#" },
    { name: "AI Suggestions", href: "#" },
  ],
  resources: [
    { name: "Career Blog", href: "#" },
    { name: "Interview Prep", href: "#" },
    { name: "Help Center", href: "#" },
  ],
  templates: [
    { name: "Software Engineer", href: "#" },
    { name: "Product Manager", href: "#" },
    { name: "Designer", href: "#" },
    { name: "Marketing", href: "#" },
  ],
  socials: [
    { name: "Twitter", href: "#" },
    { name: "LinkedIn", href: "#" },
    { name: "GitHub", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-background pt-16 pb-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary transition-transform duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg leading-none">V</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-text-primary">Velora</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs font-light">
              Your AI-powered career workspace. Build winning resumes, track job applications, and land your next role faster.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-medium text-text-primary mb-4 text-sm">Product</h4>
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

          <div>
            <h4 className="font-medium text-text-primary mb-4 text-sm">Templates</h4>
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

          <div>
            <h4 className="font-medium text-text-primary mb-4 text-sm">Resources</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-text-primary mb-4 text-sm">Socials</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.socials.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs font-medium tracking-wide text-text-muted gap-4">
          <p>© {new Date().getFullYear()} Velora. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
