import type {
  ApiResponse,
  Transaction,
  TransactionStatus,
  Conversation,
  Message,
} from "@/types";
import { TRANSACTIONS, CONVERSATIONS } from "@/data/mock";

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

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactionsByUser(
  userId: string
): Promise<ApiResponse<Transaction[]>> {
  await delay();
  const txs = TRANSACTIONS.filter(
    (t) => t.buyerId === userId || t.sellerId === userId
  );
  return ok(txs, txs.length);
}

export async function getTransactionById(
  id: string
): Promise<ApiResponse<Transaction>> {
  await delay(300);
  const tx = TRANSACTIONS.find((t) => t.id === id);
  if (!tx) return fail(`Transaction "${id}" not found`);
  return ok(tx);
}

export async function createTransaction(
  payload: Omit<Transaction, "id" | "status" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Transaction>> {
  await delay(600);
  const now = new Date().toISOString().split("T")[0];
  const tx: Transaction = {
    ...payload,
    id: `t${Date.now()}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  // In production: POST /api/transactions
  return ok(tx);
}

export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<ApiResponse<Transaction>> {
  await delay(400);
  const tx = TRANSACTIONS.find((t) => t.id === id);
  if (!tx) return fail(`Transaction "${id}" not found`);

  const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
    pending: ["accepted", "rejected", "cancelled"],
    accepted: ["completed", "cancelled"],
    rejected: [],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[tx.status].includes(status)) {
    return fail(
      `Cannot transition from "${tx.status}" to "${status}"`
    );
  }

  const updated: Transaction = {
    ...tx,
    status,
    updatedAt: new Date().toISOString().split("T")[0],
  };
  // In production: PATCH /api/transactions/:id/status
  return ok(updated);
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversationsByUser(
  userId: string
): Promise<ApiResponse<Conversation[]>> {
  await delay(350);
  const convs = CONVERSATIONS.filter((c) =>
    c.participantIds.includes(userId)
  );
  return ok(convs, convs.length);
}

export async function getConversationById(
  id: string
): Promise<ApiResponse<Conversation>> {
  await delay(300);
  const conv = CONVERSATIONS.find((c) => c.id === id);
  if (!conv) return fail(`Conversation "${id}" not found`);
  return ok(conv);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<ApiResponse<Message>> {
  await delay(250);
  const conv = CONVERSATIONS.find((c) => c.id === conversationId);
  if (!conv) return fail(`Conversation "${conversationId}" not found`);

  const message: Message = {
    id: `m${Date.now()}`,
    conversationId,
    senderId,
    text,
    sentAt: new Date().toISOString(),
    read: false,
  };
  // In production: POST /api/conversations/:id/messages
  return ok(message);
}

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<ApiResponse<boolean>> {
  await delay(200);
  const conv = CONVERSATIONS.find((c) => c.id === conversationId);
  if (!conv) return fail(`Conversation "${conversationId}" not found`);
  if (!conv.participantIds.includes(userId))
    return fail("User is not a participant in this conversation");
  // In production: POST /api/conversations/:id/read
  return ok(true);
}
