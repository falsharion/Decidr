import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './Homepage.module.css'

const TOOLS = [
  { to: '/coin',      icon: '🪙', name: 'The Coin',       tag: 'Quick pick',  desc: 'Flip across your options with AI wisdom on why it might be the right call.' },
  { to: '/pros-cons', icon: '⚖',  name: 'Pros & Cons',    tag: 'Deep dive',   desc: 'Map every upside and downside. AI delivers a clear, honest verdict.' },
  { to: '/bracket',   icon: '🥊', name: 'The Bracket',    tag: 'Head-to-head',desc: 'Fun elimination rounds until one option reigns champion.' },
  { to: '/planner',   icon: '📅', name: 'Week Planner(Beta)',   tag: 'Productivity',desc: 'Plan tasks, set goals, get an AI review of your week.' },
  { to: '/clarity',   icon: '◈',  name: 'Clarity Engine', tag: 'Framework',   desc: 'A structured 60-second framework that scores your decision objectively.' },
]

const MARQUEE_ITEMS = [
  '✦ The Coin', '🥊 The Bracket', '⚖ Pros & Cons', '📅 Week Planner',
  '◈ Clarity Engine', '✦ AI-Powered', ' Free Forever', '⚖ No Account',
]

// Floating orb that follows mouse slightly
function FloatingOrb({ className, style }) {
  return <div className={`${styles.orb} ${className}`} style={style} aria-hidden="true" />
}

// Animated grid background
function GridBg() {
  return <div className={styles.grid} aria-hidden="true" />
}

export default function HomePage() {
  const heroRef = useRef(null)

  // Subtle parallax on mouse move
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 18
      const y = (e.clientY / window.innerHeight - 0.5) * 12
      hero.style.setProperty('--mx', `${x}px`)
      hero.style.setProperty('--my', `${y}px`)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <div className={styles.page}>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className={styles.hero} ref={heroRef}>
        <GridBg />
        <FloatingOrb className={styles.orbGold}   style={{ top: '10%',  left: '-5%'  }} />
        <FloatingOrb className={styles.orbPurple} style={{ top: '20%',  right: '-8%' }} />
        <FloatingOrb className={styles.orbBlue}   style={{ bottom: '5%',left: '30%'  }} />

        <div className={styles.heroInner}>
          <div className={`${styles.heroBadge} anim-up`}>
            <span className={styles.badgeDot} />
            AI-Powered Decision Suite
          </div>

          <h1 className={`${styles.heroTitle} anim-up delay-1`}>
            Make every<br />
            <span className={styles.heroGrad}>decision</span><br />
            with clarity.
          </h1>

          <p className={`${styles.heroSub} anim-up delay-2`}>
            Five tools to cut through indecision, plan your week,
            and score your choices. Powered by AI, completely free.
          </p>

          <div className={`${styles.heroCtas} anim-up delay-3`}>
            <Link to="/clarity" className={styles.ctaPrimary}>
              <span className={styles.ctaPrimaryInner}>
                ◈ Try Clarity Engine
              </span>
            </Link>
            <Link to="/coin" className={styles.ctaSecondary}>
              Flip a coin →
            </Link>
          </div>

          {/* Stat pills */}
          <div className={`${styles.statRow} anim-up`} style={{ animationDelay: '0.4s' }}>
            {[
              { n: '5', l: 'Decision tools' },
              { n: 'AI', l: 'Powered' },
              { n: '0', l: 'Account needed' },
            ].map((s, i) => (
              <div key={i} className={styles.statPill}>
                <span className={styles.statN}>{s.n}</span>
                <span className={styles.statL}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual — floating tool cards */}
        <div className={`${styles.heroVisual} anim-up delay-2`} aria-hidden="true">
          <div className={styles.floatStack}>
            {TOOLS.slice(0, 3).map((t, i) => (
              <div key={t.to} className={styles.floatCard} style={{ '--fi': i }}>
                <span className={styles.floatIcon}>{t.icon}</span>
                <span className={styles.floatName}>{t.name}</span>
                <span className={styles.floatTag}>{t.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────── */}
      <div className={styles.marqueeWrap} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className={styles.marqueeItem}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── TOOLS GRID ──────────────────────────────────────── */}
      <section className={styles.toolsSection}>
        <div className="c">
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>What we offer</span>
            <h2 className={styles.sectionTitle}>Five ways to decide better</h2>
            <p className={styles.sectionSub}>Each tool is built for a different kind of decision. Pick the one that fits.</p>
          </div>

          <div className={styles.toolsGrid}>
            {TOOLS.map((t, i) => (
              <Link key={t.to} to={t.to}
                className={`${styles.toolCard} anim-up`}
                style={{ animationDelay: `${i * 0.07}s` }}>
                <div className={styles.toolCardInner}>
                  <div className={styles.toolCardTop}>
                    <div className={styles.toolIconWrap}>
                      <span className={styles.toolIcon}>{t.icon}</span>
                    </div>
                    <span className={styles.toolTagBadge}>{t.tag}</span>
                  </div>
                  <h3 className={styles.toolName}>{t.name}</h3>
                  <p className={styles.toolDesc}>{t.desc}</p>
                  <div className={styles.toolCta}>
                    <span>Open tool</span>
                    <span className={styles.toolArrow}>→</span>
                  </div>
                </div>
                <div className={styles.toolCardGlow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className="c-sm">
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>How it works</span>
            <h2 className={styles.sectionTitle}>Three steps to clarity</h2>
          </div>
          <div className={styles.steps}>
            {[
              { n: '01', t: 'Add your options',  d: "Type out whatever you're stuck on, 2 choices or 10.", icon: '✎' },
              { n: '02', t: 'Pick a tool',        d: 'Coin for speed, Pros & Cons for depth, Bracket for fun, Clarity for frameworks.', icon: '◈' },
              { n: '03', t: 'Get AI insight',     d: 'AI reads your situation and gives an honest, concise perspective.', icon: '✦' },
            ].map((s, i) => (
              <div key={s.n} className={`${styles.step} anim-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.stepLeft}>
                  <div className={styles.stepNum}>{s.n}</div>
                  {i < 2 && <div className={styles.stepLine} />}
                </div>
                <div className={styles.stepBody}>
                  <div className={styles.stepIcon}>{s.icon}</div>
                  <div className={styles.stepTitle}>{s.t}</div>
                  <p className={styles.stepDesc}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerGlow} />
        <div className="c-sm" style={{ position: 'relative', zIndex: 1 }}>
          <h2 className={styles.ctaBannerTitle}>Ready to decide?</h2>
          <p className={styles.ctaBannerSub}>No account. No friction. Just clarity.</p>
          <div className={styles.ctaBannerBtns}>
            <Link to="/clarity" className={styles.ctaPrimary}>◈ Start with Clarity Engine</Link>
            <Link to="/coin"    className={styles.ctaSecondary}>Or flip a coin →</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className="c">
          <div className={styles.footerInner}>
            <span className={styles.footerBrand}>✦ Decidr</span>
            <div className={styles.footerLinks}>
              {TOOLS.map(t => (
                <Link key={t.to} to={t.to} className={styles.footerLink}>{t.name}</Link>
              ))}
            </div>
            <span className={styles.footerNote}>Free forever · AI-Powered · No account needed</span>
          </div>
        </div>
      </footer>
    </div>
  )
}