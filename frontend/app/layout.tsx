import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Course Allocation System",
  description: "Merit & reservation based student course allocation with AI reporting",
};

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/courses", label: "Courses" },
  { href: "/allocation", label: "Allocation" },
  { href: "/assistant", label: "AI Assistant" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
              <span className="font-semibold text-brand">🎓 Course Allocation</span>
              <nav className="flex gap-1 text-sm">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
