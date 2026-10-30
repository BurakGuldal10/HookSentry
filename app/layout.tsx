import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookSentry | Enterprise Webhook Relay & DLQ Guardian",
  description: "Yüksek dayanıklılık, akıllı yeniden deneme (jitter & backoff) ve Dead Letter Queue destekli webhook aktarım motoru.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                <span className="font-black text-white text-lg tracking-tighter">HS</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-2">
                  HookSentry
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-semibold">
                    v1.0 Core
                  </span>
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">Resilient Webhook Gateway & DLQ</p>
              </div>
            </div>

            <nav className="flex items-center gap-4 text-sm font-medium">
              <a href="/" className="text-white hover:text-indigo-400 transition-colors">
                Endpoints
              </a>
              <a href="#events" className="text-slate-400 hover:text-white transition-colors">
                Canlı Olaylar
              </a>
              <a href="#dlq" className="text-slate-400 hover:text-white transition-colors">
                Dead Letter Queue
              </a>
              <div className="h-4 w-px bg-slate-800 mx-1"></div>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sistem Aktif
              </span>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-800/60 mt-16 py-6 text-center text-xs text-slate-500">
          HookSentry Engine &copy; 2026. Hazırlayan: <span className="text-slate-400 font-semibold">Vanlı</span> (Kıdemli Full-Stack).
        </footer>
      </body>
    </html>
  );
}
