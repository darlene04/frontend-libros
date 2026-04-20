import { Link } from "react-router-dom";
import {
  BookOpen,
  ArrowLeftRight,
  MessageCircle,
  MapPin,
  Plus,
  TrendingUp,
  Clock,
  ArrowRight,
  Flame,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  BOOKS,
  TRANSACTIONS,
  CONVERSATIONS,
  MY_BOOKS,
} from "@/data/mock";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ConditionBadge, ModeBadge } from "@/components/shared/Badge";
import StarRating from "@/components/shared/StarRating";
import type { Book } from "@/types";

const FEATURED_BOOKS  = BOOKS.filter((b) => b.isFeatured);
const RECENT_BOOKS    = [...BOOKS].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
const PENDING_COUNT   = TRANSACTIONS.filter((t) => t.status === "pending").length;
const UNREAD_MESSAGES = CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0);

const getKPIs = (firstName: string) => [
  {
    label:    "Libros disponibles",
    value:    BOOKS.length.toString(),
    sub:      "en toda la plataforma",
    icon:     BookOpen,
    iconBg:   "bg-violet-50",
    iconColor:"text-violet-600",
    trend:    "+12 esta semana",
    trendUp:  true,
  },
  {
    label:    "Intercambios activos",
    value:    PENDING_COUNT.toString(),
    sub:      PENDING_COUNT === 1 ? "solicitud pendiente" : "solicitudes pendientes",
    icon:     ArrowLeftRight,
    iconBg:   "bg-blue-50",
    iconColor:"text-blue-600",
    trend:    "Requiere atención",
    trendUp:  null,
  },
  {
    label:    "Mensajes sin leer",
    value:    UNREAD_MESSAGES.toString(),
    sub:      UNREAD_MESSAGES === 1 ? "conversación nueva" : "conversaciones nuevas",
    icon:     MessageCircle,
    iconBg:   "bg-emerald-50",
    iconColor:"text-emerald-600",
    trend:    "De 2 contactos",
    trendUp:  null,
  },
  {
    label:    "Mis libros publicados",
    value:    MY_BOOKS.length.toString(),
    sub:      `activos como ${firstName}`,
    icon:     TrendingUp,
    iconBg:   "bg-amber-50",
    iconColor:"text-amber-600",
    trend:    "Ver mis libros",
    trendUp:  null,
    href:     "/mis-libros",
  },
];

export default function Home() {
  const user      = useAuthStore((s) => s.user);
  const firstName = user?.name.split(" ")[0] ?? "Lector";
  const kpis      = getKPIs(firstName);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
              Bienvenid@ de vuelta
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Hola, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Descubre libros cerca de ti, conecta con lectores y da nueva vida a tu colección.
          </p>
        </div>

        <Link
          to="/mis-libros/nuevo"
          className={cn(
            "inline-flex items-center gap-2 self-start sm:self-auto flex-shrink-0",
            "rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5",
            "text-sm font-semibold text-white shadow-sm shadow-violet-200",
            "hover:from-violet-700 hover:to-purple-700 transition-all duration-150 active:scale-95"
          )}
        >
          <Plus className="w-4 h-4" />
          Publicar libro
        </Link>
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
  trend:     string;
  trendUp:   boolean | null;
  href?:     string;
}

function KPICard({ label, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp, href }: KPICardProps) {
  const inner = (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white p-4 flex flex-col gap-3",
        "transition-all duration-150",
        href && "hover:shadow-md hover:border-border/80 cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </span>
        {trendUp === true && (
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground/80">{label}</p>
        {trendUp === null && (
          <p className="text-[10px] text-muted-foreground/60">{trend}</p>
        )}
      </div>
    </div>
  );

  if (href) return <Link to={href}>{inner}</Link>;
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
        {/* Mode badge overlay */}
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
              ${book.price}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">MXN</span>
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
      {/* Blobs */}
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
