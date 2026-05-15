import Link from "next/link";
import { Container } from "./Container";

const footerLinks = {
  product: [
    { name: "Features", href: "#" },
    { name: "Integrations", href: "#" },
    { name: "Pricing", href: "#" },
    { name: "Changelog", href: "#" },
  ],
  resources: [
    { name: "Documentation", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Community", href: "#" },
    { name: "Help Center", href: "#" },
  ],
  social: [
    { name: "Twitter", href: "#" },
    { name: "GitHub", href: "#" },
    { name: "Discord", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-background pt-16 pb-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary transition-transform duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg leading-none">V</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-text-primary">Velora</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-sm">
              A premium, scalable foundation for your next modern SaaS application. Designed with elegance, engineered for performance.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4 text-sm">Product</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4 text-sm">Resources</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4 text-sm">Connect</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.social.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-sm text-text-muted gap-4">
          <p>© {new Date().getFullYear()} Velora Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
