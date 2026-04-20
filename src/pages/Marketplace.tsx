import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  BookOpen,
  MapPin,
  Plus,
  X,
  Check,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { BOOKS, GENRES, USERS } from "@/data/mock";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ConditionBadge, ModeBadge } from "@/components/shared/Badge";
import Avatar from "@/components/shared/Avatar";
import type { Book, BookCondition, BookMode } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode   = "grid" | "list";
type SortOption = "recent" | "price-asc" | "price-desc";

interface FilterState {
  query:      string;
  genres:     string[];
  conditions: BookCondition[];
  modes:      BookMode[];
}

const EMPTY_FILTERS: FilterState = {
  query:      "",
  genres:     [],
  conditions: [],
  modes:      [],
};

// ─── Config ───────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent",     label: "Más recientes" },
  { value: "price-asc",  label: "Menor precio"  },
  { value: "price-desc", label: "Mayor precio"  },
];

const CONDITION_OPTIONS: { value: BookCondition; label: string }[] = [
  { value: "new",        label: "Nuevo"       },
  { value: "like-new",   label: "Como nuevo"  },
  { value: "good",       label: "Bueno"       },
  { value: "acceptable", label: "Aceptable"   },
  { value: "poor",       label: "Deteriorado" },
];

const MODE_OPTIONS: { value: BookMode; label: string }[] = [
  { value: "sell",     label: "Venta"       },
  { value: "exchange", label: "Intercambio" },
  { value: "donate",   label: "Donación"    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy]     = useState<SortOption>("recent");
  const [filters, setFilters]   = useState<FilterState>(EMPTY_FILTERS);
  const [sortOpen, setSortOpen] = useState(false);

  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.conditions.length > 0 ||
    filters.modes.length > 0 ||
    filters.query.trim().length > 0;

  const filteredBooks = useMemo(() => {
    let result = [...BOOKS];

    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }
    if (filters.genres.length)     result = result.filter((b) => filters.genres.includes(b.genre));
    if (filters.conditions.length) result = result.filter((b) => filters.conditions.includes(b.condition));
    if (filters.modes.length)      result = result.filter((b) => filters.modes.includes(b.mode));

    if (sortBy === "recent")     result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortBy === "price-asc")  result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === "price-desc") result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

    return result;
  }, [filters, sortBy]);

  function clearFilters() { setFilters(EMPTY_FILTERS); }

  function toggleGenre(g: string) {
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
  }
  function toggleCondition(c: BookCondition) {
    setFilters((f) => ({
      ...f,
      conditions: f.conditions.includes(c) ? f.conditions.filter((x) => x !== c) : [...f.conditions, c],
    }));
  }
  function toggleMode(m: BookMode) {
    setFilters((f) => ({
      ...f,
      modes: f.modes.includes(m) ? f.modes.filter((x) => x !== m) : [...f.modes, m],
    }));
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Ordenar";

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            {BOOKS.length} libros disponibles · encuentra tu próxima lectura
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
      </div>

      {/* ── Search + controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o autor…"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            className={cn(
              "w-full pl-9 pr-9 py-2.5 rounded-xl text-sm",
              "border border-border bg-white",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400",
              "transition-colors"
            )}
          />
          {filters.query && (
            <button
              onClick={() => setFilters((f) => ({ ...f, query: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border border-border bg-white hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentSortLabel}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", sortOpen && "rotate-180")} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-white shadow-lg shadow-black/10 z-20 py-1 animate-in fade-in slide-in-from-top-1 duration-100">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors",
                    sortBy === opt.value
                      ? "text-violet-700 bg-violet-50 font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {opt.label}
                  {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-violet-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-border bg-white overflow-hidden flex-shrink-0">
          {(["grid", "list"] as ViewMode[]).map((mode, i) => (
            <>
              {i === 1 && <div key="sep" className="w-px h-5 bg-border" />}
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === "grid" ? "Cuadrícula" : "Lista"}
                className={cn(
                  "p-2.5 transition-colors",
                  viewMode === mode
                    ? "bg-violet-50 text-violet-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {mode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            </>
          ))}
        </div>
      </div>

      {/* ── Active filter chips ────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {filters.genres.map((g) => (
            <ActiveChip key={g} label={g} onRemove={() => toggleGenre(g)} />
          ))}
          {filters.conditions.map((c) => (
            <ActiveChip
              key={c}
              label={CONDITION_OPTIONS.find((o) => o.value === c)?.label ?? c}
              onRemove={() => toggleCondition(c)}
            />
          ))}
          {filters.modes.map((m) => (
            <ActiveChip
              key={m}
              label={MODE_OPTIONS.find((o) => o.value === m)?.label ?? m}
              onRemove={() => toggleMode(m)}
            />
          ))}
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">
            Limpiar todo
          </button>
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Filter sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-52 flex-shrink-0 sticky top-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
              <SlidersHorizontal className="w-3 h-3" />
              Filtros
            </span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[11px] text-violet-600 hover:text-violet-700 font-medium transition-colors">
                Limpiar
              </button>
            )}
          </div>

          <FilterSection title="Modo">
            {MODE_OPTIONS.map((opt) => (
              <FilterCheckbox key={opt.value} label={opt.label} checked={filters.modes.includes(opt.value)} onChange={() => toggleMode(opt.value)} />
            ))}
          </FilterSection>

          <FilterSection title="Condición">
            {CONDITION_OPTIONS.map((opt) => (
              <FilterCheckbox key={opt.value} label={opt.label} checked={filters.conditions.includes(opt.value)} onChange={() => toggleCondition(opt.value)} />
            ))}
          </FilterSection>

          <FilterSection title="Género">
            <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
              {GENRES.map((g) => (
                <FilterCheckbox key={g} label={g} checked={filters.genres.includes(g)} onChange={() => toggleGenre(g)} />
              ))}
            </div>
          </FilterSection>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredBooks.length}</span>
            {" "}libro{filteredBooks.length !== 1 ? "s" : ""} encontrado{filteredBooks.length !== 1 ? "s" : ""}
          </p>

          {filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border bg-muted/20">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">Sin resultados</p>
                <p className="text-xs text-muted-foreground max-w-xs">No encontramos libros con esos filtros.</p>
              </div>
              <button onClick={clearFilters} className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
                Limpiar filtros
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {filteredBooks.map((book) => <BookCardGrid key={book.id} book={book} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white overflow-hidden divide-y divide-border/60">
              {filteredBooks.map((book, i) => <BookCardList key={book.id} book={book} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-2">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-sm transition-colors",
        checked ? "text-violet-700 bg-violet-50" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <span className={cn(
        "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors",
        checked ? "bg-violet-600 border-violet-600" : "border-border bg-white"
      )}>
        {checked && <Check className="w-2.5 h-2.5 text-white" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="text-violet-400 hover:text-violet-700 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Book cards ───────────────────────────────────────────────────────────────

function BookCardGrid({ book }: { book: Book }) {
  return (
    <Link
      to={`/libro/${book.id}`}
      className="group relative block rounded-2xl overflow-hidden bg-muted border border-border hover:border-transparent hover:shadow-2xl hover:shadow-black/15 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute top-3 left-3">
          <ModeBadge mode={book.mode} size="sm" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
          <div>
            <p className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow">{book.title}</p>
            <p className="text-white/65 text-xs mt-0.5 truncate">{book.author}</p>
          </div>
          <div className="flex items-center justify-between">
            <ConditionBadge condition={book.condition} size="sm" />
            {book.price != null ? (
              <span className="text-white font-bold text-sm drop-shadow">S/ {book.price}</span>
            ) : (
              <span className="text-[11px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">Gratis</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BookCardList({ book, index }: { book: Book; index: number }) {
  const owner = USERS.find((u) => u.id === book.ownerId);
  return (
    <Link
      to={`/libro/${book.id}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-violet-50/30 transition-colors"
    >
      <span className="hidden sm:block w-5 text-right text-xs font-mono text-muted-foreground/30 flex-shrink-0 select-none">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="relative w-11 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border">
        <img src={book.cover} alt={book.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-semibold text-foreground leading-tight truncate group-hover:text-violet-700 transition-colors">{book.title}</p>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        <div className="flex items-center flex-wrap gap-1.5">
          <ModeBadge mode={book.mode} size="sm" />
          <ConditionBadge condition={book.condition} size="sm" />
          <span className="text-[10px] text-muted-foreground/50">{book.genre}</span>
        </div>
      </div>
      {owner && (
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <Avatar src={owner.avatar} name={owner.name} size="xs" />
          <div className="text-xs text-muted-foreground leading-tight">
            <p className="truncate max-w-[80px]">{owner.name.split(" ")[0]}</p>
            <div className="flex items-center gap-0.5 text-muted-foreground/50">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate max-w-[80px]">{book.location.split(",")[0]}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
        {book.price != null ? (
          <span className="text-sm font-bold text-foreground tabular-nums">S/ {book.price}</span>
        ) : (
          <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">Gratis</span>
        )}
        <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">{formatRelativeTime(book.createdAt)}</span>
      </div>
    </Link>
  );
}
