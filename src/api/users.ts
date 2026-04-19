import type { ApiResponse, User, Review, Notification } from "@/types";
import { USERS, REVIEWS, NOTIFICATIONS, CURRENT_USER } from "@/data/mock";

const delay = (ms = 400) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

function fail<T>(error: string): ApiResponse<T> {
  return { ok: false, data: null as T, error };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  await delay(200);
  // In production: GET /api/me
  return ok(CURRENT_USER);
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  await delay(350);
  const user = USERS.find((u) => u.id === id);
  if (!user) return fail(`User with id "${id}" not found`);
  return ok(user);
}

export async function getUsers(): Promise<ApiResponse<User[]>> {
  await delay();
  // In production: GET /api/users
  return ok(USERS);
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<User, "name" | "bio" | "location" | "avatar">>
): Promise<ApiResponse<User>> {
  await delay(500);
  const user = USERS.find((u) => u.id === id);
  if (!user) return fail(`User with id "${id}" not found`);
  // In production: PATCH /api/users/:id
  return ok({ ...user, ...patch });
}

export async function getReviewsForUser(
  userId: string
): Promise<ApiResponse<Review[]>> {
  await delay(350);
  const reviews = REVIEWS.filter((r) => r.reviewedUserId === userId);
  return ok(reviews);
}

export async function createReview(
  payload: Omit<Review, "id" | "createdAt">
): Promise<ApiResponse<Review>> {
  await delay(600);
  const review: Review = {
    ...payload,
    id: `r${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  // In production: POST /api/reviews
  return ok(review);
}

export async function getNotifications(
  userId: string
): Promise<ApiResponse<Notification[]>> {
  await delay(300);
  const notifications = NOTIFICATIONS.filter((n) => n.userId === userId);
  return ok(notifications);
}

export async function markNotificationRead(
  id: string
): Promise<ApiResponse<boolean>> {
  await delay(200);
  const exists = NOTIFICATIONS.some((n) => n.id === id);
  if (!exists) return fail(`Notification "${id}" not found`);
  // In production: PATCH /api/notifications/:id/read
  return ok(true);
}

export async function markAllNotificationsRead(
  userId: string
): Promise<ApiResponse<boolean>> {
  await delay(300);
  const count = NOTIFICATIONS.filter((n) => n.userId === userId).length;
  if (count === 0) return fail("No notifications found for this user");
  // In production: POST /api/notifications/read-all
  return ok(true);
}
