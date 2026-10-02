"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { api, ApiRequestError } from "@/lib/api";
import { toApiTime, toHHMM, WORKING_END, WORKING_START } from "@/lib/time";
import type { Room } from "@/lib/types";

const schema = z
  .object({
    room_id: z.string().min(1, "Room is required."),
    title: z.string().trim().min(1, "Title is required."),
    booking_date: z.string().min(1, "Date is required."),
    start_time: z.string().min(1, "Start time is required."),
    end_time: z.string().min(1, "End time is required."),
  })
  .superRefine((values, ctx) => {
    if (values.start_time && values.start_time < WORKING_START) {
      ctx.addIssue({
        code: "custom",
        path: ["start_time"],
        message: "Start time cannot be before 09:00.",
      });
    }
    if (values.end_time && values.end_time > WORKING_END) {
      ctx.addIssue({
        code: "custom",
        path: ["end_time"],
        message: "End time cannot be after 18:00.",
      });
    }
    if (
      values.start_time &&
      values.end_time &&
      values.end_time <= values.start_time
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["end_time"],
        message: "End time must be after start time.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface BookingModalProps {
  rooms: Room[];
  defaultDate: string;
  onClose: () => void;
  onCreated: (message: string) => Promise<void>;
}

export function BookingModal({
  rooms,
  defaultDate,
  onClose,
  onCreated,
}: BookingModalProps) {
  const [duration, setDuration] = useState(45);
  const [findingSlot, setFindingSlot] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      room_id: rooms[0] ? String(rooms[0].id) : "",
      title: "",
      booking_date: defaultDate,
      start_time: "09:00",
      end_time: "10:00",
    },
  });

  async function onSubmit(values: FormValues) {
    if (isSubmitting) return;
    try {
      const created = await api.createBooking({
        room_id: Number(values.room_id),
        title: values.title.trim(),
        booking_date: values.booking_date,
        start_time: toApiTime(values.start_time),
        end_time: toApiTime(values.end_time),
      });
      await onCreated(created.message ?? "Booking created.");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.body.message
          : "Unable to create booking.";
      toast.error(message);
    }
  }

  async function findNextSlot() {
    const values = getValues();
    if (!values.room_id || !values.booking_date) {
      toast.error("Select a room and date first.");
      return;
    }
    if (duration <= 0) {
      toast.error("Duration must be greater than 0 minutes.");
      return;
    }
    setFindingSlot(true);
    try {
      const result = await api.nextAvailable(
        Number(values.room_id),
        values.booking_date,
        duration,
      );
      if (!result.available || !result.slot) {
        toast.error(result.message || "No available slot for the requested duration.");
        return;
      }
      setValue("start_time", toHHMM(result.slot.start_time));
      setValue("end_time", toHHMM(result.slot.end_time));
      toast.success(result.message);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.body.message
          : "Unable to find a slot.";
      toast.error(message);
    } finally {
      setFindingSlot(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-labelledby="booking-form-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 sm:max-w-lg sm:rounded-xl"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="booking-form-title" className="text-lg font-semibold">
            New booking
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Room</span>
            <select
              {...register("room_id")}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-400"
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {errors.room_id ? (
              <p className="mt-1 text-xs text-red-600">{errors.room_id.message}</p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Title</span>
            <input
              {...register("title")}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-400"
              placeholder="Team Meeting"
            />
            {errors.title ? (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Date</span>
            <input
              type="date"
              {...register("booking_date")}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-400"
            />
            {errors.booking_date ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.booking_date.message}
              </p>
            ) : null}
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Start time</span>
              <input
                type="time"
                min={WORKING_START}
                max={WORKING_END}
                {...register("start_time")}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-400"
              />
              {errors.start_time ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.start_time.message}
                </p>
              ) : null}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">End time</span>
              <input
                type="time"
                min={WORKING_START}
                max={WORKING_END}
                {...register("end_time")}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-400"
              />
              {errors.end_time ? (
                <p className="mt-1 text-xs text-red-600">{errors.end_time.message}</p>
              ) : null}
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs text-slate-500">Duration (minutes)</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-400 sm:w-28"
                aria-label="Duration in minutes"
              />
              <button
                type="button"
                onClick={() => void findNextSlot()}
                disabled={findingSlot}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {findingSlot ? "Finding…" : "Find next slot"}
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-300 px-4 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Create booking"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
