import { useState, useMemo } from "react";
import { Library, BookMarked, Eye, Bookmark, TrendingUp, Tag, Repeat2, BookLock } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { BOOKS } from "@/data/mock";
import { cn } from "@/lib/utils";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type LibraryTab = "all" | "sell" | "exchange" | "reserved";

const TABS: {
  value:   LibraryTab;
  label:   string;
  icon:    React.ElementType;
  count:   number;
}[] = [
  { value: "all",      label: "Todos",       icon: BookMarked, count: 9 },
  { value: "sell",     label: "Venta",       icon: Tag,        count: 5 },
  { value: "exchange", label: "Intercambio", icon: Repeat2,    count: 3 },
  { value: "reserved", label: "Reservado",   icon: BookLock,   count: 1 },
];

// ─── Mock stats not yet in backend ───────────────────────────────────────────

const MOCK_VIEWS     = 1_847;
const MOCK_SAVED     = 52;
const MOCK_VIEW_TREND  = 18;   // % vs mes anterior
const MOCK_SAVED_TREND = 12;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");

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

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="bg-muted/50 border border-border rounded-2xl p-1 flex gap-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white text-violet-700 shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-violet-600" : "text-current")} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums",
                  isActive
                    ? "bg-violet-100 text-violet-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
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
