import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Breakdown {
  profile_completeness: number;
  verification_tier: number;
  achievement_weight: number;
  engagement: number;
}

interface Props {
  profileId: string;
}

export default function AproScoreBadge({ profileId }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    supabase
      .from('apro_scores')
      .select('score, breakdown')
      .eq('profile_id', profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setScore(data.score);
          setBreakdown(data.breakdown);
        }
      });
  }, [profileId]);

  if (score === null) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setShowTooltip(false)}
        className="flex items-center gap-1 bg-accent-soft border border-accent/20 px-2.5 py-1 hover:bg-accent-soft transition-colors"
        style={{ borderRadius: '12px' }}
      >
        <span className="font-display font-black text-accent-ink text-sm">{score}</span>
        <span className="text-[10px] text-accent-ink/70 font-display uppercase tracking-wide">Apro</span>
      </button>

      {showTooltip && breakdown && (
        <div
          className="absolute left-0 top-full mt-1 z-20 bg-white border border-line p-3 text-xs space-y-1.5 shadow-xl"
          style={{ borderRadius: '12px', minWidth: '200px' }}
        >
          <div className="font-display font-black uppercase text-accent-ink text-sm mb-2">Score breakdown</div>
          <div className="flex justify-between">
            <span className="text-text-muted">Profile completeness</span>
            <span className="font-bold">{breakdown.profile_completeness}/20</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Verification</span>
            <span className="font-bold">{breakdown.verification_tier}/30</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Achievements</span>
            <span className="font-bold">{breakdown.achievement_weight}/30</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Engagement</span>
            <span className="font-bold">{breakdown.engagement}/20</span>
          </div>
          <div className="border-t border-line mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-accent-ink">{score}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}
