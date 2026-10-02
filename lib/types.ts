export interface Room {
  id: number;
  name: string;
  description: string;
  capacity: number;
}

export interface Booking {
  id: number;
  room_id: number;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  message?: string;
}

export interface BookingConflict {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
}

export interface ApiError {
  message: string;
  conflict?: BookingConflict;
}

export interface CreateBookingPayload {
  room_id: number;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface NextAvailableSlot {
  start_time: string;
  end_time: string;
}

export interface NextAvailableResponse {
  available: boolean;
  message: string;
  slot: NextAvailableSlot | null;
}
