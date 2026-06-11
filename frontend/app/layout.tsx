import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "AI Course Allocation System",
  description: "Merit & reservation based student course allocation with AI reporting",
};

const nav = [
  { href: "/", label: "📊 Dashboard", icon: "📊" },
  { href: "/students", label: "👥 Students", icon: "👥" },
  { href: "/courses", label: "📚 Courses", icon: "📚" },
  { href: "/allocation", label: "✨ Allocation", icon: "✨" },
  { href: "/assistant", label: "🤖 AI Assistant", icon: "🤖" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <span className="text-2xl">🎓</span>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-brand to-brand-600 bg-clip-text text-transparent">Course Allocation</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">Merit-based allocation system</p>
                </div>
              </Link>
              <nav className="flex gap-1 items-center">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700 hover:text-brand dark:hover:text-brand transition-all duration-200 whitespace-nowrap"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 dark:border-slate-700 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 transition-colors duration-300">
            <p>AI Course Allocation System © 2026 • Built with Next.js & Django</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
