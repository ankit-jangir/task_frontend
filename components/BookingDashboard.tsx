"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { api, ApiRequestError } from "@/lib/api";
import { todayISO, toHHMM } from "@/lib/time";
import type { Booking, Room } from "@/lib/types";

import { BookingModal } from "./BookingModal";
import { RoomSchedule } from "./RoomSchedule";

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.body.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export function BookingDashboard() {
  const [date, setDate] = useState(todayISO);
  const [roomFilter, setRoomFilter] = useState<number | "all">("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roomId = roomFilter === "all" ? undefined : roomFilter;
      const [roomData, bookingData] = await Promise.all([
        api.getRooms(),
        api.getBookings(date, roomId),
      ]);
      setRooms(roomData);
      setBookings(bookingData);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [date, roomFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRooms = useMemo(() => {
    if (roomFilter === "all") return rooms;
    return rooms.filter((room) => room.id === roomFilter);
  }, [rooms, roomFilter]);

  async function handleCancel(booking: Booking) {
    const confirmed = window.confirm(
      `Cancel “${booking.title}” (${toHHMM(booking.start_time)}–${toHHMM(booking.end_time)})?`,
    );
    if (!confirmed) return;
    setCancellingId(booking.id);
    try {
      const result = await api.cancelBooking(booking.id);
      toast.success(result.message);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Meeting Rooms
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Book rooms between 09:00 and 18:00. Back-to-back bookings are allowed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 flex items-center gap-1.5 font-medium text-slate-700">
              <CalendarDays className="h-4 w-4" />
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Room</span>
            <select
              value={roomFilter === "all" ? "all" : String(roomFilter)}
              onChange={(event) =>
                setRoomFilter(
                  event.target.value === "all" ? "all" : Number(event.target.value),
                )
              }
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="all">All rooms</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
            <button
              type="button"
              onClick={() => void load()}
              className="ml-3 underline"
            >
              Retry
            </button>
          </div>
        ) : visibleRooms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
            No rooms found.
          </p>
        ) : (
          <div className="space-y-4">
            {visibleRooms.map((room, index) => {
              const roomBookings = bookings.filter((item) => item.room_id === room.id);
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.15) }}
                >
                  <RoomSchedule
                    room={room}
                    bookings={roomBookings}
                    cancellingId={cancellingId}
                    onCancel={handleCancel}
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {modalOpen ? (
            <BookingModal
              rooms={rooms}
              defaultDate={date}
              onClose={() => setModalOpen(false)}
              onCreated={async (message) => {
                toast.success(message);
                setModalOpen(false);
                await load();
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
