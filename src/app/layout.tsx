import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetaCraft — Gerador de SEO/OG/Schema",
  description:
    "Gera <meta> OG/Twitter e JSON‑LD com preview ao vivo e OG dinâmico.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-dvh grid grid-rows-[auto,1fr,auto]">
          <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60 border-b border-black/5 dark:border-white/5">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg font-semibold tracking-tight">
                MetaCraft
              </h1>
              <nav className="text-sm opacity-70">
                Next.js 15 • Tailwind v4 • TS 5.9
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-black/5 dark:border-white/5 text-sm opacity-70">
            <div className="mx-auto max-w-6xl px-4 py-6">
              Alguns direitos reservados — {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
