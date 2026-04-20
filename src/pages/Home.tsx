import { Link } from "react-router-dom";
import {
  BookOpen,
  BookMarked,
  ArrowLeftRight,
  MessageCircle,
  MapPin,
  Plus,
  TrendingUp,
  Clock,
  ArrowRight,
  Flame,
  Sun,
  Sunset,
  Moon,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  BOOKS,
  TRANSACTIONS,
  CONVERSATIONS,
  MY_BOOKS,
  STATS_DATA,
} from "@/data/mock";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ConditionBadge, ModeBadge } from "@/components/shared/Badge";
import StarRating from "@/components/shared/StarRating";
import type { Book } from "@/types";

const FEATURED_BOOKS   = BOOKS.filter((b) => b.isFeatured);
const RECENT_BOOKS     = [...BOOKS].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
const PENDING_COUNT    = TRANSACTIONS.filter((t) => t.status === "pending").length;
const MONTHLY_REVENUE  = STATS_DATA[STATS_DATA.length - 1].revenue;
const MONTHLY_LABEL    = new Intl.DateTimeFormat("es-PE", { month: "long" }).format(new Date());
const PREV_REVENUE     = STATS_DATA[STATS_DATA.length - 2].revenue;
const REVENUE_DELTA    = Math.round(((MONTHLY_REVENUE - PREV_REVENUE) / PREV_REVENUE) * 100);

type User = import("@/types").User;

const getKPIs = (user: User | null) => [
  {
    label:     "Libros listados",
    value:     MY_BOOKS.length.toString(),
    sub:       `de ${BOOKS.length} en plataforma`,
    icon:      BookMarked,
    iconBg:    "bg-violet-100",
    iconColor: "text-violet-700",
    cardBg:    "bg-gradient-to-br from-white to-violet-50/60",
    trend:     "+1 este mes",
    trendUp:   true,
    href:      "/mis-libros",
  },
  {
    label:     "Intercambios activos",
    value:     PENDING_COUNT.toString(),
    sub:       PENDING_COUNT === 1 ? "solicitud pendiente" : "solicitudes pendientes",
    icon:      ArrowLeftRight,
    iconBg:    "bg-blue-100",
    iconColor: "text-blue-700",
    cardBg:    "bg-gradient-to-br from-white to-blue-50/60",
    trend:     "Ver solicitudes",
    trendUp:   false,
    href:      "/intercambios",
  },
  {
    label:     "Ventas del mes",
    value:     `$${MONTHLY_REVENUE}`,
    sub:       `S/ · ${MONTHLY_LABEL}`,
    icon:      TrendingUp,
    iconBg:    "bg-emerald-100",
    iconColor: "text-emerald-700",
    cardBg:    "bg-gradient-to-br from-white to-emerald-50/60",
    trend:     `+${REVENUE_DELTA}% vs mes anterior`,
    trendUp:   REVENUE_DELTA > 0,
    href:      undefined,
  },
  {
    label:     "Rating promedio",
    value:     user?.rating.toFixed(1) ?? "—",
    sub:       `${user?.reviewCount ?? 0} reseñas recibidas`,
    icon:      Star,
    iconBg:    "bg-amber-100",
    iconColor: "text-amber-700",
    cardBg:    "bg-gradient-to-br from-white to-amber-50/60",
    trend:     "Ver reseñas",
    trendUp:   false,
    href:      "/perfil",
    rating:    user?.rating,
  },
];

// Greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return {
      saludo:     "Buenos días",
      icon:       Sun,
      tagline:    "El mejor momento para descubrir tu próxima lectura.",
      chip:       "Mañana lectora",
    };
  }
  if (hour >= 12 && hour < 19) {
    return {
      saludo:     "Buenas tardes",
      icon:       Sunset,
      tagline:    "¿Cuál será tu próxima historia? Hay libros esperándote.",
      chip:       "Tarde de libros",
    };
  }
  return {
    saludo:     "Buenas noches",
    icon:       Moon,
    tagline:    "Una última página antes de dormir... o quizás un libro nuevo.",
    chip:       "Noche de lectura",
  };
}

export default function Home() {
  const user      = useAuthStore((s) => s.user);
  const firstName = user?.name.split(" ")[0] ?? "Lector";
  const kpis      = getKPIs(user);

  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-white px-6 py-8 sm:px-10 sm:py-10">
        {/* Blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-violet-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-purple-100/30 blur-3xl" />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #7c3aed 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          {/* Left */}
          <div className="space-y-4">
            {/* Chip */}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
              <GreetIcon className="w-3 h-3" />
              {greeting.chip}
            </span>

            {/* Heading */}
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                {greeting.saludo},
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {firstName}.
                </span>
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {greeting.tagline}
            </p>

            {/* Pills + CTA */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {user?.location && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border/60 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {user.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border/60 px-2.5 py-1 rounded-full">
                <BookOpen className="w-3 h-3 flex-shrink-0" />
                {BOOKS.length} libros disponibles
              </span>

              <Link
                to="/mis-libros/nuevo"
                className={cn(
                  "inline-flex items-center gap-1.5",
                  "rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5",
                  "text-xs font-semibold text-white shadow-sm shadow-violet-200",
                  "hover:from-violet-700 hover:to-purple-700 transition-all duration-150 active:scale-95"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                Publicar libro
              </Link>
            </div>
          </div>

          {/* Right — mini stat accent */}
          <div className="hidden lg:flex flex-col items-end gap-2 flex-shrink-0 self-center">
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-violet-50 border border-violet-100 gap-1">
              <span className="text-3xl font-bold text-violet-600">{BOOKS.length}</span>
              <span className="text-[10px] text-violet-500 font-medium text-center leading-tight">libros<br/>disponibles</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-right max-w-[96px] leading-snug">
              Actualizado hoy
            </p>
          </div>
        </div>
      </section>
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Destacados"
          subtitle="Libros seleccionados para ti"
          icon={Flame}
          href="/explorar"
          cta="Ver todos"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {FEATURED_BOOKS.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <div className="border-t border-border/60" />
      <section className="space-y-4">
        <SectionHeader
          title="Publicados recientemente"
          subtitle="Los últimos en llegar a la plataforma"
          icon={Clock}
          href="/explorar"
          cta="Ver más"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {RECENT_BOOKS.map((book) => (
            <BookCardCompact key={book.id} book={book} />
          ))}
        </div>
      </section>

      <div className="border-t border-border/60" />
      <section>
        <CTABanner userName={firstName} />
      </section>
      <div className="h-4" />
    </div>
  );
}

interface KPICardProps {
  label:     string;
  value:     string;
  sub:       string;
  icon:      React.ElementType;
  iconBg:    string;
  iconColor: string;
  cardBg:    string;
  trend:     string;
  trendUp:   boolean;
  href?:     string;
  rating?:   number;
}

function KPICard({ label, value, sub, icon: Icon, iconBg, iconColor, cardBg, trend, trendUp, href, rating }: KPICardProps) {
  const inner = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border p-5 flex flex-col gap-4",
        "transition-all duration-200",
        cardBg,
        href && "hover:shadow-lg hover:shadow-black/[0.06] hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <span className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-black/[0.06]",
          iconBg
        )}>
          <Icon className={cn("w-[18px] h-[18px]", iconColor)} />
        </span>

        {trendUp && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-100">
            <TrendingUp className="w-2.5 h-2.5" />
            {trend}
          </span>
        )}
      </div>

      {/* Metric */}
      <div className="space-y-1">
        <p className="text-[30px] leading-none font-bold tracking-tight text-foreground">
          {value}
        </p>
        {rating != null && (
          <StarRating value={rating} size="sm" className="mt-1.5" />
        )}
        <p className="text-xs text-muted-foreground leading-snug">{sub}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto border-t border-black/[0.05]">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {!trendUp && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground/70">
            {trend}
            {href && <ArrowRight className="w-3 h-3" />}
          </span>
        )}
      </div>
    </div>
  );

  if (href) return <Link to={href} className="block">{inner}</Link>;
  return inner;
}

interface SectionHeaderProps {
  title:    string;
  subtitle: string;
  icon:     React.ElementType;
  href:     string;
  cta:      string;
}

function SectionHeader({ title, subtitle, icon: Icon, href, cta }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-violet-600" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Link
        to={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors flex-shrink-0 mt-1"
      >
        {cta}
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="group rounded-2xl border border-border bg-white overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-200 flex flex-col">
      {/* Cover */}
      <div className="relative overflow-hidden bg-muted aspect-[2/3]">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2">
          <ModeBadge mode={book.mode} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div>
          <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{book.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{book.author}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <ConditionBadge condition={book.condition} size="sm" />
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-auto">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{book.location}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between">
          {book.price != null ? (
            <span className="text-sm font-bold text-foreground">
              S/ {book.price}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">PEN</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-violet-600">Gratis</span>
          )}
          <Link
            to={`/libro/${book.id}`}
            className="text-[11px] font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            Ver más
          </Link>
        </div>
      </div>
    </div>
  );
}

function BookCardCompact({ book }: { book: Book }) {
  return (
    <div className="group flex flex-col gap-2">
      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-[2/3] border border-border">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-1.5 left-1.5">
          <ModeBadge mode={book.mode} size="sm" />
        </div>
      </div>
      {/* Title */}
      <div>
        <p className="text-[11px] font-semibold text-foreground leading-snug line-clamp-2">{book.title}</p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{book.author}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatRelativeTime(book.createdAt)}</p>
      </div>
    </div>
  );
}

function CTABanner({ userName }: { userName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 sm:p-8">
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-white/70 text-sm font-medium">Para ti, {userName}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            Tu colección merece<br className="hidden sm:block" /> nuevos lectores
          </h3>
          <p className="text-white/70 text-sm max-w-sm leading-relaxed">
            Publica tus libros en menos de 2 minutos y conecta con lectores cerca de ti.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
          <StarRating value={4.8} showValue size="sm" className="text-white/80" />
          <Link
            to="/mis-libros/nuevo"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
              "bg-white text-violet-700 font-semibold text-sm",
              "hover:bg-violet-50 transition-colors shadow-sm active:scale-95"
            )}
          >
            <Plus className="w-4 h-4" />
            Publicar ahora
          </Link>
        </div>
      </div>
    </div>
  );
}
