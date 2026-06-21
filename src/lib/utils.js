import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function hasAnswer(val) {
  if (!val) return false;
  try {
    const parsed = JSON.parse(val);
    return parsed?._type === 'drawing' && !!parsed.imageData;
  } catch {
    return !!val.trim();
  }
}