import type { ApiResponse, Book, BookFilters } from "@/types";
import { BOOKS } from "@/data/mock";

const delay = (ms = 400) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function ok<T>(data: T, total?: number): ApiResponse<T> {
  return {
    ok: true,
    data,
    ...(total !== undefined && {
      meta: { total, page: 1, pageSize: 20 },
    }),
  };
}

function fail<T>(error: string): ApiResponse<T> {
  return { ok: false, data: null as T, error };
}

// ─── Query helpers ────────────────────────────────────────────────────────────

function applyFilters(books: Book[], filters: BookFilters): Book[] {
  return books.filter((b) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (
        !b.title.toLowerCase().includes(q) &&
        !b.author.toLowerCase().includes(q)
      )
        return false;
    }
    if (filters.genre && b.genre !== filters.genre) return false;
    if (filters.condition && b.condition !== filters.condition) return false;
    if (filters.mode && b.mode !== filters.mode) return false;
    if (filters.language && b.language !== filters.language) return false;
    if (filters.location && !b.location.includes(filters.location))
      return false;
    if (filters.minPrice !== undefined && (b.price ?? 0) < filters.minPrice)
      return false;
    if (filters.maxPrice !== undefined && (b.price ?? 0) > filters.maxPrice)
      return false;
    return true;
  });
}

function sortBooks(books: Book[], sortBy: BookFilters["sortBy"]): Book[] {
  const copy = [...books];
  switch (sortBy) {
    case "price-asc":
      return copy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price-desc":
      return copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "recent":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getBooks(
  filters: BookFilters = {}
): Promise<ApiResponse<Book[]>> {
  await delay();
  const filtered = applyFilters(BOOKS, filters);
  const sorted = sortBooks(filtered, filters.sortBy);
  return ok(sorted, sorted.length);
}

export async function getBookById(id: string): Promise<ApiResponse<Book>> {
  await delay(300);
  const book = BOOKS.find((b) => b.id === id);
  if (!book) return fail(`Book with id "${id}" not found`);
  return ok(book);
}

export async function getFeaturedBooks(): Promise<ApiResponse<Book[]>> {
  await delay(350);
  const featured = BOOKS.filter((b) => b.isFeatured);
  return ok(featured, featured.length);
}

export async function getBooksByOwner(
  ownerId: string
): Promise<ApiResponse<Book[]>> {
  await delay();
  const books = BOOKS.filter((b) => b.ownerId === ownerId);
  return ok(books, books.length);
}

export async function createBook(
  payload: Omit<Book, "id" | "createdAt">
): Promise<ApiResponse<Book>> {
  await delay(600);
  const newBook: Book = {
    ...payload,
    id: `b${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  // In production: POST /api/books
  return ok(newBook);
}

export async function updateBook(
  id: string,
  patch: Partial<Omit<Book, "id" | "ownerId" | "createdAt">>
): Promise<ApiResponse<Book>> {
  await delay(500);
  const book = BOOKS.find((b) => b.id === id);
  if (!book) return fail(`Book with id "${id}" not found`);
  const updated = { ...book, ...patch };
  // In production: PATCH /api/books/:id
  return ok(updated);
}

export async function deleteBook(id: string): Promise<ApiResponse<boolean>> {
  await delay(400);
  const exists = BOOKS.some((b) => b.id === id);
  if (!exists) return fail(`Book with id "${id}" not found`);
  // In production: DELETE /api/books/:id
  return ok(true);
}
