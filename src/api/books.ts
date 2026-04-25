import type { ApiResponse, Book, BookFilters, BookMode, BookCondition } from "@/types";

const BOOKS_API_URL =
  import.meta.env.VITE_BOOKS_API_URL?.trim() || "http://localhost:8002/api";
const LOCAL_BOOK_COVER_PREFIX = "book-local-cover:";

interface BackendCategory {
  id: number;
  name: string;
  description?: string | null;
}

interface BackendBook {
  id: number;
  userId: number;
  title: string;
  author: string;
  category?: BackendCategory | null;
  description?: string | null;
  photoUrl?: string | null;
  price?: number | null;
  available?: boolean | null;
  active?: boolean | null;
  createdAt?: string | null;
}

interface BackendBookPayload {
  title: string;
  author: string;
  description?: string;
  photo_url?: string;
  price?: number;
  category_id?: number;
  available?: boolean;
}

function getLocalBookCover(bookId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${LOCAL_BOOK_COVER_PREFIX}${bookId}`);
}

export function saveLocalBookCover(bookId: string, coverDataUrl: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${LOCAL_BOOK_COVER_PREFIX}${bookId}`, coverDataUrl);
}

export function removeLocalBookCover(bookId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${LOCAL_BOOK_COVER_PREFIX}${bookId}`);
}

function ok<T>(data: T, total?: number): ApiResponse<T> {
  return {
    ok: true,
    data,
    ...(total !== undefined && {
      meta: { total, page: 1, pageSize: total },
    }),
  };
}

function fail<T>(error: string): ApiResponse<T> {
  return { ok: false, data: null as T, error };
}

async function requestJson<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${BOOKS_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      payload.message
        ? payload.message
        : "No se pudo completar la solicitud";
    throw new Error(message);
  }

  return payload as T;
}

function mapBackendBook(book: BackendBook): Book {
  const hasPrice = typeof book.price === "number" && !Number.isNaN(book.price);
  const mode: BookMode = hasPrice ? "sell" : "";
  const bookId = String(book.id);
  const localCover = getLocalBookCover(bookId);

  return {
    id: bookId,
    title: book.title ?? "",
    author: book.author ?? "",
    cover: localCover || book.photoUrl || "",
    description: book.description ?? "",
    genre: book.category?.name ?? "",
    year: undefined,
    language: "",
    condition: "" as BookCondition,
    mode,
    price: hasPrice ? Number(book.price) : undefined,
    available: book.available ?? true,
    ownerId: String(book.userId),
    location: "",
    createdAt: book.createdAt ?? "",
    isFeatured: false,
  };
}

function applyFilters(books: Book[], filters: BookFilters): Book[] {
  return books.filter((b) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (
        !b.title.toLowerCase().includes(q) &&
        !b.author.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.genre && b.genre !== filters.genre) return false;
    if (filters.condition && b.condition !== filters.condition) return false;
    if (filters.mode && b.mode !== filters.mode) return false;
    if (filters.language && b.language !== filters.language) return false;
    if (filters.location && !b.location.includes(filters.location)) return false;
    if (filters.minPrice !== undefined && (b.price ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && (b.price ?? 0) > filters.maxPrice) return false;
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
      return copy.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }
}

export async function getCategories(
  token: string
): Promise<ApiResponse<BackendCategory[]>> {
  try {
    const categories = await requestJson<BackendCategory[]>("/categories", token);
    return ok(categories, categories.length);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudieron obtener las categorías"
    );
  }
}

export async function getBooks(
  token: string,
  filters: BookFilters = {}
): Promise<ApiResponse<Book[]>> {
  try {
    const books = await requestJson<BackendBook[]>("/books", token);
    const mapped = books.map(mapBackendBook);
    const filtered = applyFilters(mapped, filters);
    const sorted = sortBooks(filtered, filters.sortBy);
    return ok(sorted, sorted.length);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudieron obtener los libros"
    );
  }
}

export async function getBookById(
  id: string,
  token: string
): Promise<ApiResponse<Book>> {
  try {
    const book = await requestJson<BackendBook>(`/books/${id}`, token);
    return ok(mapBackendBook(book));
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudo obtener el libro"
    );
  }
}

export async function getBooksByOwner(
  ownerId: string,
  token: string
): Promise<ApiResponse<Book[]>> {
  try {
    const books = await requestJson<BackendBook[]>(`/books/user/${ownerId}`, token);
    const mapped = books.map(mapBackendBook);
    return ok(mapped, mapped.length);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudieron obtener los libros del usuario"
    );
  }
}

export async function createBook(
  payload: Omit<Book, "id" | "createdAt">,
  token: string
): Promise<ApiResponse<Book>> {
  try {
    const categoriesResponse = await getCategories(token);
    const categoryId = categoriesResponse.ok
      ? categoriesResponse.data.find((category) => category.name === payload.genre)?.id
      : undefined;

    const body: BackendBookPayload = {
      title: payload.title,
      author: payload.author,
      description: payload.description || undefined,
      photo_url: payload.cover || undefined,
      price: payload.price,
      available: true,
      category_id: categoryId,
    };

    const book = await requestJson<BackendBook>("/books", token, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return ok(mapBackendBook(book));
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudo crear el libro"
    );
  }
}

export async function updateBook(
  id: string,
  patch: Partial<Omit<Book, "id" | "ownerId" | "createdAt">>,
  token: string
): Promise<ApiResponse<Book>> {
  try {
    const [categoriesResponse, currentBookResponse] = await Promise.all([
      getCategories(token),
      getBookById(id, token),
    ]);

    if (!currentBookResponse.ok) {
      return fail(currentBookResponse.error || "No se pudo obtener el libro actual");
    }

    const mergedBook = {
      ...currentBookResponse.data,
      ...patch,
    };

    const categoryId = categoriesResponse.ok
      ? categoriesResponse.data.find((category) => category.name === mergedBook.genre)?.id
      : undefined;

    const body: BackendBookPayload = {
      title: mergedBook.title,
      author: mergedBook.author,
      description: mergedBook.description,
      photo_url: mergedBook.cover,
      price: mergedBook.price,
      available: mergedBook.available ?? true,
      category_id: categoryId,
    };

    const book = await requestJson<BackendBook>(`/books/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return ok(mapBackendBook(book));
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudo actualizar el libro"
    );
  }
}

export async function deleteBook(
  id: string,
  token: string
): Promise<ApiResponse<boolean>> {
  try {
    await requestJson<void>(`/books/${id}`, token, {
      method: "DELETE",
    });
    removeLocalBookCover(id);
    return ok(true);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudo eliminar el libro"
    );
  }
}

export async function updateBookAvailability(
  id: string,
  available: boolean,
  token: string
): Promise<ApiResponse<Book>> {
  try {
    const book = await requestJson<BackendBook>(`/books/${id}/availability`, token, {
      method: "PUT",
      body: JSON.stringify({ available }),
    });

    return ok(mapBackendBook(book));
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "No se pudo actualizar la disponibilidad"
    );
  }
}
