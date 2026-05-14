import { Container } from "@/components/ui/Container";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Decorative background blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] -z-10" />

      <Container className="text-center z-10 animate-fade-in">
        <h1 className="text-6xl sm:text-7xl font-bold mb-6 tracking-tight">
          Welcome to <span className="text-gradient-primary">Velora</span>
        </h1>
        <p className="text-xl sm:text-2xl text-text-secondary max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          A premium, scalable foundation for your next modern SaaS application. Designed with elegance and purpose.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <button className="btn-glow">
            Start Building
          </button>
          <button className="btn-secondary">
            Read Documentation
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="card-premium p-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
              <span className="text-primary text-xl">✨</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-text-primary">Premium Design</h3>
            <p className="text-text-muted leading-relaxed">Carefully crafted components with subtle glassmorphism and modern aesthetics.</p>
          </div>
          
          <div className="card-premium p-8">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-6">
              <span className="text-secondary text-xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-text-primary">High Performance</h3>
            <p className="text-text-muted leading-relaxed">Built on Next.js 15 App Router for blazing fast loading times and SEO optimization.</p>
          </div>
          
          <div className="card-premium p-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
              <span className="text-primary text-xl">🛠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-text-primary">Scalable Architecture</h3>
            <p className="text-text-muted leading-relaxed">Clean folder structure and absolute imports designed for growing teams and features.</p>
          </div>
        </div>
      </Container>
    </main>
  );
}

