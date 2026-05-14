import { Container } from "@/components/ui/Container";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Container className="text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6 tracking-tight">
          Welcome to <span className="text-blue-600">Velora</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          A clean, scalable foundation for your next modern SaaS application. Built with Next.js 15, TypeScript, and TailwindCSS.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors">
            Get Started
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
            Documentation
          </button>
        </div>
      </Container>
    </main>
  );
}
