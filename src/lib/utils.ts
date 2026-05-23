import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price stored in kuruş (1/100 TRY) into a display string.
 *   formatPrice(12000) -> "₺120"
 *   formatPrice(12550) -> "₺125,50"
 */
export function formatPrice(kurus: number): string {
  const lira = kurus / 100;
  const hasFraction = kurus % 100 !== 0;
  return `₺${lira.toLocaleString("tr-TR", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m uzaklıkta`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")}km uzaklıkta`;
}
