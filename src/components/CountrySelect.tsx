import { useEffect, useRef, useState } from 'react';
import { COUNTRIES } from '../lib/types';
import { ChevronDown, Search } from 'lucide-react';

interface CountrySelectProps {
  value: string;
  onChange: (name: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Searchable country dropdown over the full ISO 3166-1 list.
 * Filters live (case-insensitive on name) and shows the flag emoji.
 */
export function CountrySelect({ value, onChange, className = '', placeholder = 'Select country' }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.name === value);
  const filtered = query
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between text-left ${className}`}
      >
        <span className={selected ? 'text-text' : 'text-text-muted'}>
          {selected ? `${selected.flag} ${selected.name}` : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 bg-card border border-white/10 overflow-hidden shadow-xl"
          style={{ borderRadius: '4px' }}
        >
          <div className="relative p-2 border-b border-white/10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              className="w-full bg-surface border border-white/10 pl-8 pr-3 py-2 text-sm text-text focus:border-accent/50 transition-colors"
              style={{ borderRadius: '4px' }}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-text-muted">No matches</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.name); setOpen(false); setQuery(''); }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors ${c.name === value ? 'text-accent' : 'text-text'}`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
