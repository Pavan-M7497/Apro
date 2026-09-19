/**
 * iCalendar (RFC 5545) generation, by hand.
 *
 * Meets and competitions are recorded as dates with no clock time, so these are
 * all-day events: `DTSTART;VALUE=DATE`, and a `DTEND` that is the day *after*
 * the last day, because DTEND is exclusive. Getting that wrong drops the final
 * day of a three-day meet, which is usually finals.
 *
 * The VALARM is what actually does the reminding — once the event is on the
 * athlete's own phone, the OS handles the notification. That is the whole point
 * of this over web push, which is unreliable on iOS.
 */

export interface CalendarEvent {
  /** Stable id, used for the UID. */
  id: string;
  title: string;
  /** ISO date, yyyy-mm-dd. Required — an event with no date cannot be exported. */
  startDate: string;
  /** ISO date. Falls back to startDate for a single-day event. */
  endDate?: string | null;
  city?: string | null;
  /** State name or code. Joined to the city for LOCATION. */
  region?: string | null;
  /** Put in DESCRIPTION, usually a registration URL. */
  url?: string | null;
  /** Extra DESCRIPTION text, before the URL. */
  notes?: string | null;
}

/** RFC 5545 §3.3.11 — escape TEXT values. Order matters: backslash first. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** yyyy-mm-dd -> yyyymmdd. Returns null if it is not a usable date. */
function toIcsDate(iso: string): string | null {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return iso.slice(0, 10).replace(/-/g, '');
}

/** The day after `iso`, as yyyymmdd — DTEND is exclusive for all-day events. */
function exclusiveEnd(iso: string): string | null {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * RFC 5545 §3.1 — fold lines longer than 75 octets, continuing with a space.
 * Counted in UTF-8 bytes, not characters, and a multi-byte character is never
 * split across the fold.
 */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = '';
  let bytes = 0;
  // First line allows 75 octets, continuations 74 (the leading space counts).
  let limit = 75;

  for (const char of line) {
    const size = enc.encode(char).length;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  if (current) out.push(current);

  return out.join('\r\n ');
}

/** Build a complete .ics document for one event. Null if it has no usable date. */
export function buildIcs(event: CalendarEvent): string | null {
  const start = toIcsDate(event.startDate);
  if (!start) return null;

  const end = exclusiveEnd(event.endDate || event.startDate) ?? exclusiveEnd(event.startDate);
  if (!end) return null;

  const location = [event.city, event.region].filter(Boolean).join(', ');
  const description = [event.notes, event.url].filter(Boolean).join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aevon//Aquatics Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@aevon.in`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (location) lines.push(`LOCATION:${escapeText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (event.url) lines.push(`URL:${escapeText(event.url)}`);

  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P1D',
    `DESCRIPTION:${escapeText(`${event.title} starts tomorrow`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );

  // RFC 5545 requires CRLF, and a trailing one after the final line.
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Filesystem-safe filename stem from an event title. */
function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'event'
  );
}

/**
 * Generate and hand the .ics to the browser. Returns false when the event has
 * no date to export, so the caller can keep the button hidden.
 */
export function downloadIcs(event: CalendarEvent): boolean {
  const ics = buildIcs(event);
  if (!ics) return false;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(event.title)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
