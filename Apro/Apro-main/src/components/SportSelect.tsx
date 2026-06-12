import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SPORTS } from '../lib/types';

interface SportOption {
  name: string;
  is_official: boolean;
}

interface Props {
  value: string;
  onChange: (sport: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SportSelect({ value, onChange, className = '', disabled }: Props) {
  const [sports, setSports] = useState<SportOption[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customSport, setCustomSport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    const { data } = await supabase
      .from('sports_list')
      .select('name, is_official')
      .order('is_official', { ascending: false })
      .order('usage_count', { ascending: false });
    if (data && data.length > 0) {
      setSports(data);
    } else {
      // Fallback to hardcoded if DB not yet migrated
      setSports(SPORTS.map((s) => ({ name: s, is_official: true })));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === '__add__') {
      setAddingCustom(true);
    } else {
      onChange(v);
    }
  };

  const handleSubmitCustom = async () => {
    const name = customSport.trim();
    if (!name) return;
    setSubmitting(true);

    // Case-insensitive check
    const { data: existing } = await supabase
      .from('sports_list')
      .select('name, usage_count')
      .ilike('name', name)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('sports_list')
        .update({ usage_count: existing.usage_count + 1 })
        .ilike('name', name);
      onChange(existing.name);
    } else {
      await supabase
        .from('sports_list')
        .insert({ name, is_official: false, usage_count: 1 });
      onChange(name);
    }

    await loadSports();
    setAddingCustom(false);
    setCustomSport('');
    setSubmitting(false);
  };

  if (addingCustom) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={customSport}
          onChange={(e) => setCustomSport(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitCustom()}
          placeholder="Enter your sport"
          className={`flex-1 bg-surface border border-white/10 px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors ${className}`}
          style={{ borderRadius: '4px' }}
          disabled={submitting}
        />
        <button
          type="button"
          onClick={handleSubmitCustom}
          disabled={submitting || !customSport.trim()}
          className="px-4 py-2.5 bg-accent text-primary text-sm font-bold disabled:opacity-50 hover:bg-accent-hover transition-colors"
          style={{ borderRadius: '4px' }}
        >
          {submitting ? '...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => { setAddingCustom(false); setCustomSport(''); }}
          className="px-3 py-2.5 bg-white/5 border border-white/10 text-sm text-text-muted hover:text-text transition-colors"
          style={{ borderRadius: '4px' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      className={`w-full bg-surface border border-white/10 px-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors appearance-none ${className}`}
      style={{ borderRadius: '4px' }}
      disabled={disabled}
    >
      <option value="">Select sport</option>
      {sports.map((s) => (
        <option key={s.name} value={s.name}>{s.name}</option>
      ))}
      <option value="__add__">+ Add your sport</option>
    </select>
  );
}

interface PositionProps {
  sport: string;
  value: string;
  onChange: (pos: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PositionSelect({ sport, value, onChange, className = '', disabled }: PositionProps) {
  const [positions, setPositions] = useState<string[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customPosition, setCustomPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sport) { setPositions([]); return; }
    loadPositions();
  }, [sport]);

  const loadPositions = async () => {
    const { data } = await supabase
      .from('positions_list')
      .select('name')
      .eq('sport_name', sport)
      .order('is_official', { ascending: false })
      .order('usage_count', { ascending: false });
    if (data && data.length > 0) {
      setPositions(data.map((p: { name: string }) => p.name));
    } else {
      setPositions([]);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === '__add__') {
      setAddingCustom(true);
    } else {
      onChange(v);
    }
  };

  const handleSubmitCustom = async () => {
    const name = customPosition.trim();
    if (!name || !sport) return;
    setSubmitting(true);

    const { data: existing } = await supabase
      .from('positions_list')
      .select('name, usage_count')
      .eq('sport_name', sport)
      .ilike('name', name)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('positions_list')
        .update({ usage_count: existing.usage_count + 1 })
        .eq('sport_name', sport)
        .ilike('name', name);
      onChange(existing.name);
    } else {
      await supabase
        .from('positions_list')
        .insert({ sport_name: sport, name, is_official: false, usage_count: 1 });
      onChange(name);
    }

    await loadPositions();
    setAddingCustom(false);
    setCustomPosition('');
    setSubmitting(false);
  };

  if (!sport) return null;

  if (addingCustom) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={customPosition}
          onChange={(e) => setCustomPosition(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitCustom()}
          placeholder="Enter your position"
          className={`flex-1 bg-surface border border-white/10 px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors ${className}`}
          style={{ borderRadius: '4px' }}
          disabled={submitting}
        />
        <button
          type="button"
          onClick={handleSubmitCustom}
          disabled={submitting || !customPosition.trim()}
          className="px-4 py-2.5 bg-accent text-primary text-sm font-bold disabled:opacity-50 hover:bg-accent-hover transition-colors"
          style={{ borderRadius: '4px' }}
        >
          {submitting ? '...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => { setAddingCustom(false); setCustomPosition(''); }}
          className="px-3 py-2.5 bg-white/5 border border-white/10 text-sm text-text-muted hover:text-text transition-colors"
          style={{ borderRadius: '4px' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (positions.length === 0) return null;

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      className={`w-full bg-surface border border-white/10 px-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors appearance-none ${className}`}
      style={{ borderRadius: '4px' }}
      disabled={disabled}
    >
      <option value="">Select position</option>
      {positions.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
      <option value="__add__">+ Add your position</option>
    </select>
  );
}
