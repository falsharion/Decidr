import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { decodeSharePayload } from '../lib/utils'
import styles from './SharePage.module.css'

export default function SharePage() {
  const [params]              = useSearchParams()
  const [data, setData]       = useState(null)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const d = params.get('d')
    if (!d) { setInvalid(true); return }
    const decoded = decodeSharePayload(d)
    if (!decoded) { setInvalid(true); return }

    // Support both old format (result = string) and new rich format (result = object)
    const r = decoded.result
    if (!r) { setInvalid(true); return }

    setData({
      tool: decoded.tool || 'Decidr',
      ts:   decoded.ts,
      // Normalise: old format had result as a plain string
      coinFlip: typeof r === 'string' ? r    : r.coinFlip,
      aiPick:   typeof r === 'string' ? null : r.aiPick   ?? null,
      aiReason: typeof r === 'string' ? null : r.aiReason ?? null,
      context:  typeof r === 'string' ? null : r.context  ?? null,
    })
  }, [params])

  if (invalid) return (
    <div className="page text-c">
      <div className="c-sm">
        <p className="eyebrow mb-12">Invalid Link</p>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(32px,6vw,52px)', color: 'var(--cream)', marginBottom: 14 }}>
          The Coin is lost.
        </h1>
        <p className="text-muted mb-20" style={{ maxWidth: 340, margin: '0 auto 24px' }}>
          This share link appears to be broken or expired.
        </p>
        <Link to="/" className="btn-outline">← Go Home</Link>
      </div>
    </div>
  )

  if (!data) return (
    <div className="page">
      <div className="spinner-wrap"><div className="spinner" /></div>
    </div>
  )

  const dateStr = data.ts
    ? new Date(data.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="page">
      <div className="c-sm">
        <div className="text-c mb-20">
          <p className="eyebrow">Shared via Decidr · {data.tool}</p>
          {dateStr && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{dateStr}</p>}
        </div>

        {/* ── Coin flip result ─────────────────────────────── */}
        <div className={`${styles.flipCard} anim-scale`}>
          <div className={styles.flipCardAccent} />
          <div className={styles.flipCardGlow} />
          <span className={styles.flipEyebrow}>
            <span aria-hidden="true">🪙</span> The Coin Landed On
          </span>
          <h1 className={styles.flipTitle}>{data.coinFlip}</h1>
          {data.context && (
            <div className={styles.contextEcho}>
              <span className={styles.contextLabel}>Situation</span>
              <p className={styles.contextText}>"{data.context}"</p>
            </div>
          )}
        </div>

        {/* ── AI recommendation (only if present) ──────────── */}
        {data.aiPick && (
          <div className={`${styles.aiCard} anim-up delay-1`}>
            <div className={styles.aiCardAccent} />
            <div className={styles.aiCardHeader}>
              <span className={styles.aiStar} aria-hidden="true">✦</span>
              <span className={styles.aiCardLabel}>AI Recommendation</span>
              <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>Given context</span>
            </div>

            <div className={styles.aiPickBlock}>
              <span className={styles.aiPickLabel}>AI would choose</span>
              <p className={styles.aiPickText}>{data.aiPick}</p>
              {data.aiPick === data.coinFlip
                ? <span className={styles.matchBadge}>✓ Agrees with the flip</span>
                : <span className={styles.diffBadge}>Different from the flip</span>
              }
            </div>

            {data.aiReason && (
              <div className={styles.aiReasonBlock}>
                <span className="badge badge-purple" style={{ marginBottom: 10, display: 'inline-flex' }}>✦ Why</span>
                <p className={styles.aiReasonText}>{data.aiReason}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-c mt-20">
          <Link to="/coin" className="btn-outline">Make your own decision →</Link>
        </div>
      </div>
    </div>
  )
}