import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CircleHelp,
  Clock,
  Layers,
  ShoppingBag,
  Tag,
  ArrowUpRight,
  BookMarked,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getBookById } from "@/api/books";
import { getTransactionsByUser } from "@/api/transactions";
import { getUserById } from "@/api/users";
import type { Book, Transaction, User } from "@/types";
import Avatar from "@/components/shared/Avatar";
import EmptyState from "@/components/shared/EmptyState";
import { cn, formatPrice, formatRelativeTime } from "@/lib/utils";

type ModeTab = "all" | "sell" | "unspecified";

const SUMMARY_CARDS = [
  {
    key: "total" as const,
    label: "Total",
    icon: Layers,
    color: "text-violet-600",
    bg: "bg-violet-50",
    ring: "ring-violet-100",
    border: "border-violet-200/60",
    accent: "from-violet-50 to-white",
  },
  {
    key: "sales" as const,
    label: "Ventas",
    icon: ShoppingBag,
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-100",
    border: "border-amber-200/60",
    accent: "from-amber-50 to-white",
  },
  {
    key: "unspecified" as const,
    label: "Sin modo",
    icon: CircleHelp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
    border: "border-emerald-200/60",
    accent: "from-emerald-50 to-white",
  },
  {
    key: "recent" as const,
    label: "Este mes",
    icon: Clock,
    color: "text-gray-500",
    bg: "bg-gray-50",
    ring: "ring-gray-100",
    border: "border-gray-200/60",
    accent: "from-gray-50 to-white",
  },
] as const;

export default function ExchangesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [activeTab, setActiveTab] = useState<ModeTab>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [booksById, setBooksById] = useState<Record<string, Book>>({});
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(Boolean(currentUser?.id && token));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id || !token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const userId = currentUser.id;
    const authToken = token;

    async function loadTransactions() {
      setIsLoading(true);
      setError(null);

      const response = await getTransactionsByUser(userId, authToken);
      if (cancelled) return;

      if (!response.ok) {
        setError(response.error || "No se pudieron cargar las transacciones");
        setIsLoading(false);
        return;
      }

      setTransactions(response.data);

      const bookIds = [...new Set(response.data.map((tx) => tx.bookId).filter(Boolean))];
      const peerIds = [
        ...new Set(
          response.data.map((tx) =>
            tx.buyerId === userId ? tx.sellerId : tx.buyerId
          )
        ),
      ];

      const [books, users] = await Promise.all([
        Promise.all(
          bookIds.map(async (bookId) => {
            const bookResponse = await getBookById(bookId, authToken);
            return bookResponse.ok ? bookResponse.data : null;
          })
        ),
        Promise.all(
          peerIds.map(async (uid) => {
            const userResponse = await getUserById(uid, authToken);
            return userResponse.ok ? userResponse.data : null;
          })
        ),
      ]);

      if (cancelled) return;

      setBooksById(
        Object.fromEntries(
          books
            .filter((book): book is Book => book !== null)
            .map((book) => [book.id, book])
        )
      );
      setUsersById(
        Object.fromEntries(
          users
            .filter((user): user is User => user !== null)
            .map((user) => [user.id, user])
        )
      );
      setIsLoading(false);
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, token]);

  const stats = useMemo(
    () => ({
      total: transactions.length,
      sales: transactions.filter((transaction) => transaction.mode === "sell").length,
      unspecified: transactions.filter((transaction) => !transaction.mode).length,
      recent: transactions.filter((transaction) => {
        if (!transaction.createdAt) return false;
        return (
          new Date(transaction.createdAt).getTime() >=
          Date.now() - 30 * 24 * 60 * 60 * 1000
        );
      }).length,
    }),
    [transactions]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return transactions;
    if (activeTab === "unspecified") {
      return transactions.filter((transaction) => !transaction.mode);
    }
    return transactions.filter((transaction) => transaction.mode === activeTab);
  }, [activeTab, transactions]);

  const tabCounts = useMemo(
    () => ({
      all: transactions.length,
      sell: transactions.filter((transaction) => transaction.mode === "sell").length,
      unspecified: transactions.filter((transaction) => !transaction.mode).length,
    }),
    [transactions]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Intercambios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historial de transacciones registradas en el backend de libros
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
          Cargando transacciones...
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUMMARY_CARDS.map(({ key, label, icon: Icon, color, bg, ring, border, accent }) => (
          <div
            key={key}
            className={cn(
              "rounded-2xl border bg-gradient-to-b p-5 flex flex-col gap-4 shadow-sm",
              border,
              accent
            )}
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center ring-1", bg, ring)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div>
              <p className={cn("text-3xl font-bold tabular-nums tracking-tight leading-none", color)}>
                {stats[key]}
              </p>
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-2">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-muted/50 border border-border rounded-2xl p-1 flex gap-0.5 w-full sm:w-fit">
          {[
            { value: "all" as const, label: "Todos", icon: Layers },
            { value: "sell" as const, label: "Ventas", icon: Tag },
            { value: "unspecified" as const, label: "Sin modo", icon: CircleHelp },
          ].map(({ value, label, icon: Icon }) => {
            const active = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap",
                  active
                    ? "bg-white text-violet-700 shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", active ? "text-violet-600" : "text-current")} />
                {label}
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums",
                    active ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground"
                  )}
                >
                  {tabCounts[value]}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm">
            <EmptyState
              icon={BookMarked}
              title="Sin transacciones"
              description="No hay registros de transactions para este filtro."
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden divide-y divide-border/50">
            {filtered.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                tx={transaction}
                book={booksById[transaction.bookId]}
                peer={usersById[transaction.buyerId === currentUser?.id ? transaction.sellerId : transaction.buyerId]}
                currentUserId={currentUser?.id ?? ""}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TransactionRowProps {
  tx: Transaction;
  book?: Book;
  peer?: User;
  currentUserId: string;
}

function TransactionRow({ tx, book, peer, currentUserId }: TransactionRowProps) {
  const modeLabel = tx.mode === "sell" ? "Venta" : "Sin especificar";
  const modeColor =
    tx.mode === "sell" ? "bg-violet-100 text-violet-800" : "bg-gray-100 text-gray-700";
  const ModeIcon = tx.mode === "sell" ? ShoppingBag : CircleHelp;
  const isBuyer = tx.buyerId === currentUserId;

  return (
    <div className="flex items-start sm:items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group">
      <Link
        to={tx.bookId ? `/libro/${tx.bookId}` : "#"}
        className="flex-shrink-0 w-12 h-16 sm:w-14 sm:h-[72px] rounded-xl overflow-hidden bg-muted/50 shadow-sm ring-1 ring-border/50 hover:ring-violet-300 transition-all"
      >
        {book?.cover ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-muted-foreground/30" />
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", modeColor)}>
            <ModeIcon className="w-2.5 h-2.5" />
            {modeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500" />
            Completado
          </span>
        </div>

        <div>
          <Link
            to={tx.bookId ? `/libro/${tx.bookId}` : "#"}
            className="text-sm font-semibold text-foreground hover:text-violet-700 transition-colors leading-tight block truncate"
          >
            {book?.title ?? "Libro no disponible"}
          </Link>
          {book && <p className="text-xs text-muted-foreground truncate">{book.author}</p>}
        </div>

        <div className="flex items-center gap-3 pt-0.5">
          {peer ? (
            <div className="flex items-center gap-1.5">
              <Avatar src={peer.avatar} name={peer.name} size="xs" />
              <span className="text-xs text-muted-foreground truncate">{peer.name}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground truncate">
              {isBuyer ? "Vendedor" : "Comprador"} sin perfil cargado
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <CalendarDays className="w-2.5 h-2.5 flex-shrink-0" />
            {tx.createdAt ? formatRelativeTime(tx.createdAt) : "Sin fecha"}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-2 self-center">
        {tx.mode === "sell" && tx.agreedPrice != null ? (
          <span className="text-base font-bold text-violet-700 tabular-nums leading-none">
            {formatPrice(tx.agreedPrice)}
          </span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Sin monto</span>
        )}
        {tx.bookId && (
          <Link
            to={`/libro/${tx.bookId}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Ver libro
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
