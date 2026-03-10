'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/lib/api/services/auth';
import styles from './page.module.css';

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Too weak',   color: '#ef4444' };
  if (score === 2) return { score, label: 'Weak',       color: '#f97316' };
  if (score === 3) return { score, label: 'Fair',       color: '#eab308' };
  if (score === 4) return { score, label: 'Strong',     color: '#22c55e' };
  return               { score, label: 'Very strong', color: '#10b981' };
}

// ── Eye icon ──────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ── Inner component (needs useSearchParams) ───────────────────────────────────
function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Token & user_id come silently from the email link — user never sees them
  const token  = searchParams?.get('token')   ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showCpw,     setShowCpw]     = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const strength = getStrength(newPassword);
  const pwMatch  = confirmPw ? newPassword === confirmPw : null;

  // If the link is missing the token — show an error state immediately
  const invalidLink = !token;

  const canSubmit =
    !invalidLink &&
    newPassword.length >= 8 &&
    newPassword === confirmPw &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);

    try {
      const res = await AuthService.resetPassword({
        token:        token,
        new_password: newPassword,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(
          typeof res.errors === 'string'
            ? res.errors
            : 'Something went wrong. Please request a new reset link.'
        );
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid / expired link ─────────────────────────────────────────────────
  if (invalidLink) {
    return (
      <div className={styles.invalidState}>
        <div className={styles.invalidIcon}>
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className={styles.invalidTitle}>Invalid reset link</h2>
        <p className={styles.invalidSub}>
          This link is missing required parameters or may have expired. Please request a new one.
        </p>
        <Link href="/forgot-password" className={styles.requestNewBtn}>
          Request a new link
        </Link>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>
          <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className={styles.successTitle}>Password updated!</h2>
        <p className={styles.successSub}>Redirecting you to login…</p>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} />
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>

      {/* New password */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="rp-new">
          New password
        </label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </span>
          <input
            id="rp-new"
            type={showPw ? 'text' : 'password'}
            className={styles.input}
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button type="button" className={styles.eyeBtn}
            onClick={() => setShowPw(v => !v)} aria-label="Toggle password visibility">
            <EyeIcon open={showPw} />
          </button>
        </div>

        {newPassword && (
          <div className={styles.strengthMeter}>
            <div className={styles.strengthBars}>
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={styles.strengthBar}
                  style={{ background: n <= strength.score ? strength.color : '#e5e7eb' }} />
              ))}
            </div>
            <span className={styles.strengthLabel} style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="rp-confirm">
          Confirm new password
        </label>
        <div className={`${styles.inputWrap} ${pwMatch === false ? styles.wrapError : pwMatch === true ? styles.wrapSuccess : ''}`}>
          <span className={styles.inputIcon}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4"/>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </span>
          <input
            id="rp-confirm"
            type={showCpw ? 'text' : 'password'}
            className={styles.input}
            placeholder="Repeat your password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button type="button" className={styles.eyeBtn}
            onClick={() => setShowCpw(v => !v)} aria-label="Toggle confirm password visibility">
            <EyeIcon open={showCpw} />
          </button>
        </div>
        {pwMatch === false && (
          <p className={styles.fieldError}>Passwords don't match</p>
        )}
      </div>

      {/* API error */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        className={`${styles.submitBtn} ${loading ? styles.submitLoading : ''}`}
        disabled={!canSubmit}
      >
        {loading ? (
          <span className={styles.spinner} />
        ) : (
          <>
            Set new password
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>

      <p className={styles.backLink}>
        Remember it?{' '}
        <Link href="/login" className={styles.link}>Back to login</Link>
      </p>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img src="/logo.png" alt="" className={styles.brandImg}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            {/* <span className={styles.brandFallback}>S</span> */}
          </div>
          <span className={styles.brandName}>SpellHire</span>
        </div>

        <div className={styles.heading}>
          <h1 className={styles.title}>Set new password</h1>
          <p className={styles.subtitle}>
            Choose a strong new password for your account.
          </p>
        </div>

        <Suspense fallback={<div className={styles.shimmer} />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}