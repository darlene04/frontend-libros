import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  X,
  Check,
  ChevronDown,
  ArrowUpDown,
  Store,
  Tag,
  Repeat2,
  Layers,
  AlertCircle,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { getBooks } from "@/api/books";
import { getUserById } from "@/api/users";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ConditionBadge, ModeBadge } from "@/components/shared/Badge";
import { Skeleton } from "@/components/shared/LoadingCard";
import EmptyState from "@/components/shared/EmptyState";
import Avatar from "@/components/shared/Avatar";
import type { Book, BookCondition, BookMode, User } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode   = "grid" | "list";
type SortOption = "recent" | "price-asc" | "price-desc";
type ModeFilter = BookMode | "all";

interface FilterState {
  query:      string;
  mode:       ModeFilter;
  conditions: BookCondition[];
  genres:     string[];
}

const EMPTY_FILTERS: FilterState = {
  query:      "",
  mode:       "all",
  conditions: [],
  genres:     [],
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

const MODE_TABS: { value: ModeFilter; label: string; icon: React.ElementType }[] = [
  { value: "all",      label: "Todos",       icon: Layers  },
  { value: "sell",     label: "Venta",       icon: Tag     },
  { value: "exchange", label: "Intercambio", icon: Repeat2 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Marketplace() {
  const token = useAuthStore((s) => s.token);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy]     = useState<SortOption>("recent");
  const [filters, setFilters]   = useState<FilterState>(EMPTY_FILTERS);
  const [sortOpen, setSortOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError]     = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [ownersById, setOwnersById] = useState<Record<string, User>>({});
  const sortRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setIsError(true);
      return;
    }

    let cancelled = false;
    const authToken = token;

    async function loadBooks() {
      setIsLoading(true);
      setIsError(false);

      const response = await getBooks(authToken);

      if (cancelled) return;

      if (!response.ok) {
        setIsError(true);
        setIsLoading(false);
        return;
      }

      setBooks(response.data);

      const ownerIds = [...new Set(response.data.map((book) => book.ownerId))];
      const owners = await Promise.all(
        ownerIds.map(async (ownerId) => {
          const ownerResponse = await getUserById(ownerId, authToken);
          return ownerResponse.ok ? ownerResponse.data : null;
        })
      );

      if (cancelled) return;

      setOwnersById(
        Object.fromEntries(
          owners
            .filter((owner): owner is User => owner !== null)
            .map((owner) => [owner.id, owner])
        )
      );
      setIsLoading(false);
    }

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleRetry() {
    if (!token) {
      setIsError(true);
      return;
    }
    const retryToken = token;
    setIsLoading(true);
    setIsError(false);
    getBooks(retryToken).then(async (response) => {
      if (!response.ok) {
        setIsError(true);
        setIsLoading(false);
        return;
      }

      setBooks(response.data);
      const ownerIds = [...new Set(response.data.map((book) => book.ownerId))];
      const owners = await Promise.all(
        ownerIds.map(async (ownerId) => {
          const ownerResponse = await getUserById(ownerId, retryToken);
          return ownerResponse.ok ? ownerResponse.data : null;
        })
      );
      setOwnersById(
        Object.fromEntries(
          owners
            .filter((owner): owner is User => owner !== null)
            .map((owner) => [owner.id, owner])
        )
      );
      setIsLoading(false);
    });
  }

  const hasActiveFilters =
    filters.mode !== "all" ||
    filters.conditions.length > 0 ||
    filters.genres.length > 0 ||
    filters.query.trim().length > 0;

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }
    if (filters.mode !== "all")    result = result.filter((b) => b.mode === filters.mode);
    if (filters.conditions.length) result = result.filter((b) => filters.conditions.includes(b.condition));
    if (filters.genres.length)     result = result.filter((b) => filters.genres.includes(b.genre));

    if (sortBy === "recent")     result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortBy === "price-asc")  result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === "price-desc") result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

    return result;
  }, [books, filters, sortBy]);

  const genres = useMemo(
    () => [...new Set(books.map((book) => book.genre).filter(Boolean))],
    [books]
  );

  function clearFilters() { setFilters(EMPTY_FILTERS); }

  function toggleCondition(c: BookCondition) {
    setFilters((f) => ({
      ...f,
      conditions: f.conditions.includes(c)
        ? f.conditions.filter((x) => x !== c)
        : [...f.conditions, c],
    }));
  }
  function toggleGenre(g: string) {
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(g)
        ? f.genres.filter((x) => x !== g)
        : [...f.genres, g],
    }));
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Ordenar";

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {/* ── Page title ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm shadow-violet-200/60 flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
              Market<span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">place</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{books.length} libros disponibles</p>
          </div>
        </div>
        <Link
          to="/publicar"
          className={cn(
            "inline-flex items-center gap-2 flex-shrink-0",
            "rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2",
            "text-sm font-semibold text-white shadow-sm shadow-violet-200",
            "hover:from-violet-700 hover:to-purple-700 transition-all duration-150 active:scale-95"
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Publicar libro</span>
          <span className="sm:hidden">Publicar</span>
        </Link>
      </div>

      {/* ── Unified filter + search bar ───────────────────────────────────── */}
      <FilterBar
        filters={filters}
        genres={genres}
        sortBy={sortBy}
        sortOpen={sortOpen}
        sortRef={sortRef}
        viewMode={viewMode}
        onModeChange={(mode) => setFilters((f) => ({ ...f, mode }))}
        onToggleCondition={toggleCondition}
        onToggleGenre={toggleGenre}
        onQueryChange={(q) => setFilters((f) => ({ ...f, query: q }))}
        onSortOpen={() => setSortOpen((o) => !o)}
        onSortChange={(s) => { setSortBy(s); setSortOpen(false); }}
        onViewChange={setViewMode}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        currentSortLabel={currentSortLabel}
      />

      {/* ── Active filter chips ────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Activos:</span>
          {filters.mode !== "all" && (
            <ActiveChip
              label={MODE_TABS.find((m) => m.value === filters.mode)?.label ?? filters.mode}
              onRemove={() => setFilters((f) => ({ ...f, mode: "all" }))}
            />
          )}
          {filters.conditions.map((c) => (
            <ActiveChip
              key={c}
              label={CONDITION_OPTIONS.find((o) => o.value === c)?.label ?? c}
              onRemove={() => toggleCondition(c)}
            />
          ))}
          {filters.genres.map((g) => (
            <ActiveChip key={g} label={g} onRemove={() => toggleGenre(g)} />
          ))}
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-red-500 transition-colors ml-1">
            Limpiar todo
          </button>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {isLoading ? (
          <ResultsLoading viewMode={viewMode} />
        ) : isError ? (
          <ResultsError onRetry={handleRetry} />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredBooks.length}</span>
              {" "}libro{filteredBooks.length !== 1 ? "s" : ""} encontrado{filteredBooks.length !== 1 ? "s" : ""}
            </p>

            {filteredBooks.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={hasActiveFilters ? "Sin resultados para estos filtros" : "No hay libros disponibles"}
                description={
                  hasActiveFilters
                    ? "Prueba ajustando o limpiando los filtros para ver más libros."
                    : "Sé el primero en publicar un libro en el marketplace."
                }
                action={
                  hasActiveFilters ? (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Limpiar filtros
                    </button>
                  ) : (
                    <Link
                      to="/publicar"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-sm shadow-violet-200 hover:from-violet-700 hover:to-purple-700 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Publicar libro
                    </Link>
                  )
                }
                className="rounded-2xl border border-dashed border-border bg-muted/20"
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredBooks.map((book) => (
                  <BookCardGrid
                    key={book.id}
                    book={book}
                    owner={ownersById[book.ownerId]}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-white overflow-hidden divide-y divide-border/60">
                {filteredBooks.map((book, i) => (
                  <BookCardList
                    key={book.id}
                    book={book}
                    owner={ownersById[book.ownerId]}
                    index={i}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function BookCardGridSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-muted">
      <div className="aspect-[3/4] animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10 relative">
        <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
          <Skeleton className="h-3 w-3/4 opacity-30" />
          <Skeleton className="h-2.5 w-1/2 opacity-20" />
          <div className="flex items-center justify-between pt-0.5">
            <Skeleton className="h-4 w-14 rounded-full opacity-20" />
            <Skeleton className="h-4 w-10 opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BookCardListSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="hidden sm:block w-5 flex-shrink-0" />
      <Skeleton className="w-11 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5 pt-0.5">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 ml-2 flex-shrink-0">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

function ResultsLoading({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-36" />
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <BookCardGridSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardListSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ResultsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 rounded-2xl border border-dashed border-red-200 bg-red-50/30">
      <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center ring-1 ring-red-200">
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>
      <div className="text-center space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-foreground">No se pudo cargar el catálogo</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ocurrió un error al obtener los libros. Verifica tu conexión e intenta de nuevo.
        </p>
      </div>
      <button
        onClick={onRetry}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold",
          "text-white bg-gradient-to-r from-violet-600 to-purple-600",
          "shadow-sm shadow-violet-200 hover:from-violet-700 hover:to-purple-700",
          "transition-all duration-150 active:scale-95"
        )}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Reintentar
      </button>
    </div>
  );
}

// ─── Filter bar (unified) ─────────────────────────────────────────────────────

interface FilterBarProps {
  filters:           FilterState;
  genres:            string[];
  sortBy:            SortOption;
  sortOpen:          boolean;
  sortRef:           React.RefObject<HTMLDivElement | null>;
  viewMode:          ViewMode;
  currentSortLabel:  string;
  hasActiveFilters:  boolean;
  onModeChange:      (mode: ModeFilter) => void;
  onToggleCondition: (c: BookCondition) => void;
  onToggleGenre:     (g: string) => void;
  onQueryChange:     (q: string) => void;
  onSortOpen:        () => void;
  onSortChange:      (s: SortOption) => void;
  onViewChange:      (v: ViewMode) => void;
  onClear:           () => void;
}

function FilterBar({
  filters, genres, sortBy, sortOpen, sortRef, viewMode, currentSortLabel,
  hasActiveFilters, onModeChange, onToggleCondition, onToggleGenre,
  onQueryChange, onSortOpen, onSortChange, onViewChange, onClear,
}: FilterBarProps) {
  const [openPanel, setOpenPanel] = useState<"condition" | "genre" | null>(null);
  const [genreSearch, setGenreSearch] = useState("");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredGenres = genreSearch.trim()
    ? genres.filter((g) => g.toLowerCase().includes(genreSearch.toLowerCase()))
    : genres;

  function togglePanel(panel: "condition" | "genre") {
    setOpenPanel((p) => (p === panel ? null : panel));
    if (panel === "genre") setGenreSearch("");
  }

  return (
    <div ref={barRef} className="rounded-2xl border border-border bg-white divide-y divide-border/60">

      {/* ── Row 1: mode tabs + search + sort + view ────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
        {/* Mode pills */}
        <div className="flex items-center gap-1.5">
          {MODE_TABS.map(({ value, label, icon: Icon }) => {
            const active = filters.mode === value;
            return (
              <button
                key={value}
                onClick={() => onModeChange(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                  "transition-all duration-150 active:scale-95",
                  active
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-5 bg-border mx-1 flex-shrink-0" />

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o autor…"
            value={filters.query}
            onChange={(e) => onQueryChange(e.target.value)}
            className={cn(
              "w-full pl-8 pr-8 py-1.5 rounded-lg text-sm bg-muted/60 border-0",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
            )}
          />
          {filters.query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div ref={sortRef} className="relative flex-shrink-0">
          <button
            onClick={onSortOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{currentSortLabel}</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", sortOpen && "rotate-180")} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-white shadow-lg shadow-black/10 z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-100">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSortChange(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors",
                    sortBy === opt.value ? "text-violet-700 bg-violet-50 font-medium" : "text-foreground hover:bg-muted"
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
        <div className="flex items-center rounded-lg border border-border bg-white overflow-hidden flex-shrink-0">
          {(["grid", "list"] as ViewMode[]).map((mode, i) => (
            <div key={mode} className="contents">
              {i === 1 && <div className="w-px h-4 bg-border" />}
              <button
                onClick={() => onViewChange(mode)}
                title={mode === "grid" ? "Cuadrícula" : "Lista"}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === mode ? "bg-violet-50 text-violet-700" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {mode === "grid" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: secondary filters ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
        <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
          Filtrar por
        </span>

        {/* Condition dropdown */}
        <div className="relative">
          <button
            onClick={() => togglePanel("condition")}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150",
              filters.conditions.length > 0
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Condición
            {filters.conditions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {filters.conditions.length}
              </span>
            )}
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", openPanel === "condition" && "rotate-180")} />
          </button>

          {openPanel === "condition" && (
            <div className="absolute left-0 top-full mt-2 w-52 rounded-2xl border border-border bg-white shadow-xl shadow-black/10 z-30 py-2 animate-in fade-in slide-in-from-top-1 duration-100">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-4 pt-2 pb-2.5">
                Condición del libro
              </p>
              {CONDITION_OPTIONS.map((opt) => {
                const checked = filters.conditions.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => onToggleCondition(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                      checked ? "bg-violet-50 text-violet-700" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors",
                      checked ? "bg-violet-600 border-violet-600" : "border-border bg-white"
                    )}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Genre dropdown */}
        <div className="relative">
          <button
            onClick={() => togglePanel("genre")}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150",
              filters.genres.length > 0
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Género
            {filters.genres.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {filters.genres.length}
              </span>
            )}
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", openPanel === "genre" && "rotate-180")} />
          </button>

          {openPanel === "genre" && (
            <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-border bg-white shadow-xl shadow-black/10 z-30 animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="p-2.5 border-b border-border/60">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar género…"
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-muted border-0 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
              <div className="py-1.5 max-h-56 overflow-y-auto">
                {filteredGenres.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-5">Sin resultados</p>
                ) : filteredGenres.map((g) => {
                  const checked = filters.genres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => onToggleGenre(g)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                        checked ? "bg-violet-50 text-violet-700" : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className={cn(
                        "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors",
                        checked ? "bg-violet-600 border-violet-600" : "border-border bg-white"
                      )}>
                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors ml-auto"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Active chip ──────────────────────────────────────────────────────────────

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

function BookCardGrid({ book, owner: _owner }: { book: Book; owner?: User }) {
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
        {book.mode && (
          <div className="absolute top-3 left-3">
            <ModeBadge mode={book.mode} size="sm" />
          </div>
        )}
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
              <span className="text-[11px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {book.mode ? "Gratis" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BookCardList({
  book,
  owner,
  index,
}: {
  book: Book;
  owner?: User;
  index: number;
}) {
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
