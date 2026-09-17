import { CalendarPlus } from 'lucide-react';
import { buildIcs, downloadIcs, type CalendarEvent } from '../lib/ics';

/**
 * Downloads a one-event .ics. Renders nothing when the event has no date, since
 * there would be nothing to put in the calendar.
 */
export default function AddToCalendarButton({
  event,
  tone = 'quiet',
}: {
  event: CalendarEvent;
  /** 'quiet' is a bordered chip; 'solid' is the lime fill. */
  tone?: 'quiet' | 'solid';
}) {
  // Same check the download does, run up front so a dead button never appears.
  if (!event.startDate || !buildIcs(event)) return null;

  const style =
    tone === 'solid'
      ? { background: 'var(--accent)', color: 'var(--on-accent)', border: '1px solid transparent' }
      : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' };

  return (
    <button
      type="button"
      onClick={(e) => {
        // Cards often sit inside their own click handler.
        e.stopPropagation();
        downloadIcs(event);
      }}
      className="inline-flex items-center gap-1.5 flex-shrink-0 hover:opacity-85 transition-opacity"
      style={{ ...style, borderRadius: '12px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}
      title="Download a calendar file with a reminder one day before"
    >
      <CalendarPlus className="w-3.5 h-3.5" />
      Add to calendar
    </button>
  );
}
