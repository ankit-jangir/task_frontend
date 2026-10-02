import type {
  ApiError,
  Booking,
  CreateBookingPayload,
  NextAvailableResponse,
  Room,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiRequestError extends Error {
  status: number;
  body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.message || "Request failed.");
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError(0, {
      message: "Unable to reach the booking API. Check NEXT_PUBLIC_API_URL.",
    });
  }

  let body: ApiError | T | null = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text) as ApiError | T;
    } catch {
      body = { message: "The server returned an unexpected response." };
    }
  }

  if (!response.ok) {
    const errorBody = (body as ApiError | null) ?? {
      message: "Request failed.",
    };
    throw new ApiRequestError(response.status, {
      message: errorBody.message || "Request failed.",
      conflict: errorBody.conflict,
    });
  }

  return body as T;
}

export const api = {
  getRooms: () => request<Room[]>("/api/rooms"),
  getBookings: (date: string, roomId?: number) => {
    const params = new URLSearchParams({ date });
    if (roomId) params.set("room_id", String(roomId));
    return request<Booking[]>(`/api/bookings?${params.toString()}`);
  },
  createBooking: (payload: CreateBookingPayload) =>
    request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cancelBooking: (bookingId: number) =>
    request<{ message: string }>(`/api/bookings/${bookingId}`, {
      method: "DELETE",
    }),
  nextAvailable: (roomId: number, date: string, duration: number) =>
    request<NextAvailableResponse>(
      `/api/rooms/${roomId}/next-available?date=${date}&duration=${duration}`,
    ),
};
