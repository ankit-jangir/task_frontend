"use client";

import { Trash2, Users } from "lucide-react";

import { HOURS, timeToPercent, toHHMM } from "@/lib/time";
import type { Booking, Room } from "@/lib/types";

interface RoomScheduleProps {
  room: Room;
  bookings: Booking[];
  cancellingId: number | null;
  onCancel: (booking: Booking) => void;
}

export function RoomSchedule({
  room,
  bookings,
  cancellingId,
  onCancel,
}: RoomScheduleProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-medium text-slate-900">{room.name}</h2>
          <p className="truncate text-sm text-slate-500">{room.description}</p>
        </div>
        <p className="inline-flex shrink-0 items-center gap-1 text-sm text-slate-600">
          <Users className="h-4 w-4" />
          Capacity {room.capacity}
        </p>
      </div>

      <div className="px-4 py-3">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="relative mx-1 h-12 min-w-[28rem] rounded-md bg-slate-50 sm:min-w-0">
            {bookings.map((booking) => {
              const left = Math.max(timeToPercent(booking.start_time), 0);
              const right = Math.min(timeToPercent(booking.end_time), 100);
              const width = Math.max(right - left, 1.5);
              return (
                <div
                  key={booking.id}
                  className="absolute top-1.5 bottom-5 rounded bg-sky-700/85"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${booking.title} ${toHHMM(booking.start_time)}–${toHHMM(booking.end_time)}`}
                />
              );
            })}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-0.5 text-[10px] text-slate-400">
              {HOURS.map((hour) => (
                <span key={hour}>{String(hour).padStart(2, "0")}</span>
              ))}
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <p className="py-3 text-sm text-slate-500">No bookings for this date.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{booking.title}</p>
                  <p className="text-sm text-slate-500">
                    {toHHMM(booking.start_time)}–{toHHMM(booking.end_time)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={cancellingId === booking.id}
                  onClick={() => onCancel(booking)}
                  className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
