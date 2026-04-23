import { useMemo } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  BookMarked,
  Star,
  ShoppingBag,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { useAuthStore } from "@/store/useAuthStore";
import { BOOKS, TRANSACTIONS, REVIEWS, STATS_DATA } from "@/data/mock";
import { cn, formatPrice } from "@/lib/utils";
import StarRating from "@/components/shared/StarRating";

// ─── KPI data ─────────────────────────────────────────────────────────────────

const MONTH_LABEL = new Intl.DateTimeFormat("es-PE", { month: "long" }).format(new Date());

// Use the two most recent stat entries to compute trends
const CUR  = STATS_DATA[STATS_DATA.length - 2]; // Nov — most complete month
const PREV = STATS_DATA[STATS_DATA.length - 3]; // Oct

// Chart series — revenue + transactions per month
const CHART_DATA = STATS_DATA.map((d) => ({
  month:        d.month,
  ventas:       d.revenue,
  intercambios: d.transactions,
}));

function pct(cur: number, prev: number) {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const kpis = useMemo(() => {
    const myBooks       = BOOKS.filter((b) => b.ownerId === user?.id);
    const activeDeals   = TRANSACTIONS.filter(
      (t) => t.status === "pending" || t.status === "accepted"
    );
    const myReviews     = REVIEWS.filter((r) => r.reviewedUserId === user?.id);
    const avgRating     = myReviews.length
      ? myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length
      : (user?.rating ?? 0);

    return {
      revenue:      CUR.revenue,
      revenueTrend: pct(CUR.revenue, PREV.revenue),
      activeDeals:  activeDeals.length,
      dealsTrend:   pct(CUR.transactions, PREV.transactions),
      booksPosted:  user?.booksPosted ?? myBooks.length,
      booksTrend:   pct(CUR.booksListed, PREV.booksListed),
      rating:       avgRating,
      reviewCount:  user?.reviewCount ?? myReviews.length,
    };
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm shadow-violet-200/60 flex-shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
              Dash<span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">board</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Resumen de tu actividad en Booker
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <KPICard
          title={`Ventas de ${MONTH_LABEL}`}
          value={formatPrice(kpis.revenue)}
          trend={kpis.revenueTrend}
          trendBase="vs mes anterior"
          icon={ShoppingBag}
          footer={`${CUR.transactions} transacciones`}
          color="violet"
        />

        <KPICard
          title="Intercambios activos"
          value={String(kpis.activeDeals)}
          trend={kpis.dealsTrend}
          trendBase="vs mes anterior"
          icon={ArrowLeftRight}
          footer="pendientes o aceptados"
          color="blue"
        />

        <KPICard
          title="Libros publicados"
          value={String(kpis.booksPosted)}
          trend={kpis.booksTrend}
          trendBase="vs mes anterior"
          icon={BookMarked}
          footer={`${CUR.booksListed} listados este mes`}
          color="emerald"
        />

        <KPICard
          title="Rating promedio"
          value={kpis.rating.toFixed(1)}
          icon={Star}
          footer={`${kpis.reviewCount} reseñas recibidas`}
          color="amber"
          ratingValue={kpis.rating}
        />

      </div>

      {/* ── Area chart ────────────────────────────────────────────────────── */}
      <AreaChartCard />

    </div>
  );
}

// ─── Area chart card ──────────────────────────────────────────────────────────

function AreaChartCard() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Actividad mensual</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ventas e intercambios — últimos 6 meses
          </p>
        </div>
        <div className="flex items-center gap-5 flex-shrink-0">
          <LegendDot color="#7c3aed" label="Ventas (S/)" />
          <LegendDot color="#3b82f6" label="Intercambios" />
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="gradIntercambios" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.14} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
            width={36}
          />

          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="ventas"
            name="Ventas"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#gradVentas)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#7c3aed" }}
          />

          <Area
            type="monotone"
            dataKey="intercambios"
            name="Intercambios"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#gradIntercambios)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#3b82f6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-white shadow-lg shadow-black/10 px-4 py-3 min-w-[148px]">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {entry.dataKey === "ventas" ? `S/ ${entry.value}` : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Legend dot ───────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  violet:  {
    iconBg:   "bg-violet-100",
    iconText: "text-violet-600",
    valueBg:  "from-violet-600 to-purple-600",
    accent:   "border-violet-100",
  },
  blue:    {
    iconBg:   "bg-blue-100",
    iconText: "text-blue-600",
    valueBg:  "from-blue-600 to-sky-500",
    accent:   "border-blue-100",
  },
  emerald: {
    iconBg:   "bg-emerald-100",
    iconText: "text-emerald-600",
    valueBg:  "from-emerald-600 to-teal-500",
    accent:   "border-emerald-100",
  },
  amber:   {
    iconBg:   "bg-amber-100",
    iconText: "text-amber-600",
    valueBg:  "from-amber-500 to-orange-400",
    accent:   "border-amber-100",
  },
} as const;

interface KPICardProps {
  title:        string;
  value:        string;
  icon:         React.ElementType;
  footer:       string;
  color:        keyof typeof COLOR_MAP;
  trend?:       number | null;
  trendBase?:   string;
  ratingValue?: number;
}

function KPICard({
  title,
  value,
  icon: Icon,
  footer,
  color,
  trend,
  trendBase,
  ratingValue,
}: KPICardProps) {
  const c = COLOR_MAP[color];
  const positive = trend != null && trend >= 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-white p-5 overflow-hidden",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5",
        "transition-all duration-200",
        c.accent
      )}
    >
      {/* Subtle top-right glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.06]"
        style={{ background: `radial-gradient(circle, var(--tw-gradient-stops))` }}
        aria-hidden
      />

      {/* Icon + trend row */}
      <div className="flex items-start justify-between mb-5">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", c.iconBg)}>
          <Icon className={cn("w-5 h-5", c.iconText)} />
        </div>

        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {positive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {positive ? "+" : ""}{trend}%
          </span>
        )}
      </div>

      {/* Value */}
      <p
        className={cn(
          "text-[30px] font-bold tracking-tight leading-none mb-1",
          `bg-gradient-to-br ${c.valueBg} bg-clip-text text-transparent`
        )}
      >
        {value}
      </p>

      {/* Title */}
      <p className="text-sm text-muted-foreground">{title}</p>

      {/* Rating stars */}
      {ratingValue != null && (
        <div className="mt-2">
          <StarRating value={ratingValue} size="sm" />
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border/60">
        <p className="text-xs text-muted-foreground">
          {trend != null && trendBase ? (
            <span className={cn("font-medium", positive ? "text-emerald-600" : "text-red-500")}>
              {positive ? "+" : ""}{trend}%{" "}
            </span>
          ) : null}
          {footer}
        </p>
      </div>
    </div>
  );
}
