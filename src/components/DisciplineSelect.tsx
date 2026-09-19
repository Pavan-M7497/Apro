import { DISCIPLINES, eventsFor, WATERPOLO_POSITIONS, MAX_PRIMARY_EVENTS } from '../lib/types';

const selectClass =
  'w-full bg-surface border border-line px-4 py-2.5 text-sm text-text focus:border-accent-ink transition-colors appearance-none';

interface DisciplineProps {
  value: string;
  onChange: (discipline: string) => void;
  className?: string;
  disabled?: boolean;
  /** Label for the empty option — e.g. "All disciplines" in filters. */
  placeholder?: string;
}

/** Fixed picker over the five aquatics disciplines. No custom entries. */
export function DisciplineSelect({ value, onChange, className = '', disabled, placeholder = 'Select discipline' }: DisciplineProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectClass} ${className}`}
      style={{ borderRadius: '12px' }}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {DISCIPLINES.map((d) => (
        <option key={d.id} value={d.id}>{d.name}</option>
      ))}
    </select>
  );
}

interface PositionProps {
  value: string;
  onChange: (position: string) => void;
  className?: string;
  disabled?: boolean;
}

/** Water polo playing position. */
export function WaterpoloPositionSelect({ value, onChange, className = '', disabled }: PositionProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectClass} ${className}`}
      style={{ borderRadius: '12px' }}
      disabled={disabled}
    >
      <option value="">Select position</option>
      {WATERPOLO_POSITIONS.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  );
}

interface EventsProps {
  discipline: string;
  /** Currently selected events. */
  value: string[];
  onChange: (events: string[]) => void;
  max?: number;
}

/** Multi-select of an athlete's primary events, capped at `max`. */
export function PrimaryEventsSelect({ discipline, value, onChange, max = MAX_PRIMARY_EVENTS }: EventsProps) {
  const options = eventsFor(discipline);
  if (options.length === 0) return null;

  const toggle = (ev: string) => {
    if (value.includes(ev)) {
      onChange(value.filter((e) => e !== ev));
    } else if (value.length < max) {
      onChange([...value, ev]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((ev) => {
          const on = value.includes(ev);
          const full = !on && value.length >= max;
          return (
            <button
              key={ev}
              type="button"
              onClick={() => toggle(ev)}
              disabled={full}
              className="transition-colors disabled:opacity-40"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '5px 10px',
                borderRadius: '999px',
                background: on ? 'var(--accent-soft)' : 'var(--bg-soft)',
                border: on ? '1px solid var(--accent-ink)' : '1px solid var(--border)',
                color: on ? 'var(--accent-ink)' : 'var(--text-muted)',
                cursor: full ? 'not-allowed' : 'pointer',
              }}
            >
              {ev}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-text-muted mt-2">
        {value.length}/{max} selected
      </p>
    </div>
  );
}
