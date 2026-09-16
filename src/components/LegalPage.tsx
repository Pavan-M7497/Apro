import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AproLockup } from './Logo';
import { ArrowLeft } from 'lucide-react';

/** Contact address used across the legal pages and the in-app copy. */
export const CONTACT_EMAIL = 'privacy@apro.in';

/**
 * Shared shell for /terms and /privacy. Both are public routes, so this cannot
 * assume a signed-in user or the app sidebar.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 20px 96px' }}>
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link to="/" className="inline-flex items-center">
            <AproLockup size={24} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 hover:underline"
            style={{ fontSize: '13px', color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <h1
          className="font-display font-black uppercase"
          style={{ fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-0.015em', lineHeight: 1.05, color: 'var(--text)' }}
        >
          {title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px', marginBottom: '32px' }}>
          Last updated: {updated}
        </p>

        <div className="legal-body">{children}</div>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {title === 'Privacy Policy' ? (
              <>Also read our <Link to="/terms" style={{ color: 'var(--accent-ink)' }} className="hover:underline">Terms of Use</Link>.</>
            ) : (
              <>Also read our <Link to="/privacy" style={{ color: 'var(--accent-ink)' }} className="hover:underline">Privacy Policy</Link>.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Section heading inside a legal page. */
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2
        className="font-display font-black uppercase"
        style={{ fontSize: '19px', letterSpacing: '0.01em', color: 'var(--text)', marginBottom: '10px' }}
      >
        {heading}
      </h2>
      <div style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>{children}</div>
    </section>
  );
}
