import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function hasAnswer(val) {
  if (!val) return false;
  try {
    const parsed = JSON.parse(val);
    // Handle drawing answers
    if (parsed?._type === 'drawing') return !!parsed.imageData;
    // Any other valid JSON (numbers, booleans, objects) counts as answered
    return true;
  } catch {
    // Plain text
    return !!val.trim();
  }
}