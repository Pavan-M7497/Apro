import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { IndianState } from '../lib/types';
import { ChevronDown, Search } from 'lucide-react';

interface StateSelectProps {
  /** Selected state code, e.g. 'KA'. */
  value: string;
  onChange: (code: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Searchable picker over Indian states and union territories.
 * States are listed first, union territories after.
 */
export function StateSelect({ value, onChange, className = '', placeholder = 'Select state' }: StateSelectProps) {
  const [states, setStates] = useState<IndianState[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('indian_states')
        .select('code, name, type')
        .order('name', { ascending: true });
      setStates((data as IndianState[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selected = states.find((s) => s.code === value);
  const matches = query
    ? states.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : states;

  const groups: { label: string; items: IndianState[] }[] = [
    { label: 'States', items: matches.filter((s) => s.type === 'state') },
    { label: 'Union Territories', items: matches.filter((s) => s.type === 'ut') },
  ].filter((g) => g.items.length > 0);

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between text-left ${className}`}
      >
        <span className={selected ? 'text-text' : 'text-text-muted'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 bg-card border border-line overflow-hidden shadow-xl"
          style={{ borderRadius: '12px' }}
        >
          <div className="relative p-2 border-b border-line">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search states…"
              className="w-full bg-surface border border-line pl-8 pr-3 py-2 text-sm text-text focus:border-accent/50 transition-colors"
              style={{ borderRadius: '12px' }}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="px-3 py-3 text-sm text-text-muted">No matches</div>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <div
                    className="px-3 py-1.5 sticky top-0 bg-card"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {g.label}
                  </div>
                  {g.items.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => pick(s.code)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors ${s.code === value ? 'text-accent-ink' : 'text-text'}`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
