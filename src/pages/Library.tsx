import { useMemo } from "react";
import { Library, BookMarked, Eye, Bookmark, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BOOKS } from "@/data/mock";
import { cn } from "@/lib/utils";

// ─── Mock stats not yet in backend ───────────────────────────────────────────

const MOCK_VIEWS     = 1_847;
const MOCK_SAVED     = 52;
const MOCK_VIEW_TREND  = 18;   // % vs mes anterior
const MOCK_SAVED_TREND = 12;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user);

  const published = useMemo(
    () => user?.booksPosted ?? BOOKS.filter((b) => b.ownerId === user?.id).length,
    [user]
  );

  const stats = [
    {
      label:    "Libros publicados",
      value:    published,
      icon:     BookMarked,
      color:    "violet" as const,
      trend:    null,
      footnote: "en el marketplace",
    },
    {
      label:    "Vistas totales",
      value:    MOCK_VIEWS.toLocaleString("es-PE"),
      icon:     Eye,
      color:    "blue" as const,
      trend:    MOCK_VIEW_TREND,
      footnote: "este mes",
    },
    {
      label:    "Guardados",
      value:    MOCK_SAVED,
      icon:     Bookmark,
      color:    "emerald" as const,
      trend:    MOCK_SAVED_TREND,
      footnote: "por otros lectores",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm shadow-violet-200/60 flex-shrink-0">
          <Library className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
            Mi biblio
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              teca
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestiona y organiza todos tus libros publicados
          </p>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border shadow-sm">
        {stats.map((s, i) => (
          <StatBlock key={i} {...s} />
        ))}
      </div>

    </div>
  );
}

// ─── Stat block ───────────────────────────────────────────────────────────────

const COLOR_MAP = {
  violet:  { iconBg: "bg-violet-100", iconText: "text-violet-600", value: "text-violet-700" },
  blue:    { iconBg: "bg-blue-100",   iconText: "text-blue-600",   value: "text-blue-700"   },
  emerald: { iconBg: "bg-emerald-100",iconText: "text-emerald-600",value: "text-emerald-700"},
} as const;

interface StatBlockProps {
  label:    string;
  value:    string | number;
  icon:     React.ElementType;
  color:    keyof typeof COLOR_MAP;
  trend:    number | null;
  footnote: string;
}

function StatBlock({ label, value, icon: Icon, color, trend, footnote }: StatBlockProps) {
  const c = COLOR_MAP[color];

  return (
    <div className="bg-white px-6 py-5 flex items-center gap-5 hover:bg-muted/20 transition-colors">
      {/* Icon */}
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", c.iconBg)}>
        <Icon className={cn("w-5 h-5", c.iconText)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-2.5">
          <span className={cn("text-2xl font-bold tracking-tight tabular-nums", c.value)}>
            {value}
          </span>
          {trend != null && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              +{trend}%
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{footnote}</p>
      </div>
    </div>
  );
}
