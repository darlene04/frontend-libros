import { mapBackendUser } from "@/api/auth";
import type { ApiResponse, User } from "@/types";

const ORCHESTRATOR_API_URL =
  import.meta.env.VITE_ORCHESTRATOR_API_URL?.trim() || "http://localhost:8004/api";

interface PurchaseResponse {
  transaction?: {
    id?: number | string;
  };
  solicitud?: {
    id?: string;
  };
}

interface BackendZone {
  id: number;
  name: string;
}

interface BackendUser {
  id: number;
  name: string;
  email: string;
  zone_id?: number | null;
  zone?: BackendZone | null;
  photo_url?: string | null;
  created_at: string;
}

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

function fail<T>(error: string): ApiResponse<T> {
  return { ok: false, data: null as T, error };
}

export async function createPurchaseOrder(
  payload: {
    bookId: string;
    message: string;
  },
  token: string
): Promise<ApiResponse<{ transactionId?: string; solicitudId?: string }>> {
  try {
    const response = await fetch(`${ORCHESTRATOR_API_URL}/orders/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        book_id: Number(payload.bookId),
        message: payload.message,
      }),
    });

    const payloadJson =
      ((await response.json().catch(() => null)) as
        | { data?: PurchaseResponse; error?: string }
        | null) ?? null;

    if (!response.ok) {
      return fail(payloadJson?.error || "No se pudo procesar la compra");
    }

    return ok({
      transactionId: payloadJson?.data?.transaction?.id
        ? String(payloadJson.data.transaction.id)
        : undefined,
      solicitudId: payloadJson?.data?.solicitud?.id,
    });
  } catch {
    return fail("No se pudo conectar con el orquestador");
  }
}

export async function getSellerProfileByBookId(
  bookId: string,
  token: string
): Promise<ApiResponse<{ userId: string; seller: User }>> {
  try {
    const response = await fetch(
      `${ORCHESTRATOR_API_URL}/orders/book/${bookId}/seller-profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const payloadJson =
      ((await response.json().catch(() => null)) as
        | { data?: { user_id?: number | string; seller?: BackendUser }; error?: string }
        | null) ?? null;

    if (!response.ok || !payloadJson?.data?.seller || payloadJson.data.user_id == null) {
      return fail(payloadJson?.error || "No se pudo obtener el perfil del vendedor");
    }

    return ok({
      userId: String(payloadJson.data.user_id),
      seller: mapBackendUser(payloadJson.data.seller),
    });
  } catch {
    return fail("No se pudo conectar con el orquestador");
  }
}
