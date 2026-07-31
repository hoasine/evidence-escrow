import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr: string, size = 4): string {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

/** Format wei-like integer (as number from contract) to GEN string. */
export function formatGen(wei: number | string | bigint, digits = 4): string {
  try {
    const n = typeof wei === "bigint" ? wei : BigInt(Math.trunc(Number(wei)));
    const whole = n / 10n ** 18n;
    const frac = n % 10n ** 18n;
    const fracStr = frac.toString().padStart(18, "0").slice(0, digits).replace(/0+$/, "");
    return fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return String(wei);
  }
}

export function parseGenToWei(amount: string): bigint {
  const t = amount.trim();
  if (!t || Number(t) <= 0) throw new Error("Stake must be greater than 0");
  const [w, f = ""] = t.split(".");
  const frac = (f + "000000000000000000").slice(0, 18);
  return BigInt(w || "0") * 10n ** 18n + BigInt(frac);
}
