export const WORKING_START = "09:00";
export const WORKING_END = "18:00";
export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function toHHMM(value: string): string {
  return value.slice(0, 5);
}

export function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export function timeToPercent(value: string): number {
  const [hours, minutes] = toHHMM(value).split(":").map(Number);
  const start = 9 * 60;
  const end = 18 * 60;
  const current = hours * 60 + minutes;
  return ((current - start) / (end - start)) * 100;
}
