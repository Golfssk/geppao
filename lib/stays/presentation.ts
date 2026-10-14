export function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;} catch {return null;}
}
export function safePhone(value: string | null | undefined): string | null {
  return value && /^\+?[\d\s()-]{5,30}$/.test(value) ? `tel:${value.replace(/[^\d+]/g,'')}` : null;
}
