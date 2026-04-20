import { Outlet, Link } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -left-32 w-[500px] h-[500px] bg-violet-200/35 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-32 w-[500px] h-[500px] bg-purple-200/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-violet-100/20 rounded-full blur-3xl" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle, #a78bfa 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <header className="relative z-10 flex items-center px-6 h-16 border-b border-border/50">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-md shadow-violet-200 transition-transform group-hover:scale-105">
              <BookOpen className="w-[16px] h-[16px] text-white" />
            </div>
            <span className="text-foreground">Booker</span>
          </Link>

          {/* Back link */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px]">
          <Outlet />
        </div>
      </main>
      <footer className="relative z-10 py-5 text-center border-t border-border/40">
        <p className="text-xs text-muted-foreground/60">
          © 2025 Booker &middot;{" "}
          <a
            href="#"
            className="hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            Términos
          </a>{" "}
          &middot;{" "}
          <a
            href="#"
            className="hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            Privacidad
          </a>
        </p>
      </footer>
    </div>
  );
}
