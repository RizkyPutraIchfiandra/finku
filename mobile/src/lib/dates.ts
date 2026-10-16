/**
 * Tanggal grouping helpers — Indonesian day/month names via date-fns locale `id`.
 *
 * - `dayKey(date)`   -> "2026-10-12" (stable bucket key, local time)
 * - `dayLabel(date)` -> "Senin, 12 Okt 2026"
 */
import { format, isToday, isYesterday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/** Local-time day bucket, e.g. "2026-10-12". Groups transactions by calendar day. */
export function dayKey(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, 'yyyy-MM-dd');
}

/** Human label: "Hari ini" / "Kemarin" / "Senin, 12 Okt 2026". */
export function dayLabel(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isToday(d)) return 'Hari ini';
  if (isYesterday(d)) return 'Kemarin';
  return format(d, 'EEEE, d MMM yyyy', { locale: idLocale });
}
