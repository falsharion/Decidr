import { useState, useEffect, useRef, useCallback } from 'react'
import PageHeader from '../components/ui/PageHeader'
import styles from './Clarityenginepage.module.css'

// ── Scoring ──────────────────────────────────────────────────
function computeScore({ stakes, reversibility, regret, instinct, timeframe }) {
  const s = { high: 3, medium: 2, low: 1 }[stakes] ?? 2
  const r = { easy: 1, moderate: 2, hard: 3 }[reversibility] ?? 2
  const g = { yes: 3, maybe: 2, no: 1 }[regret] ?? 2
  const i = { yes: 3, unsure: 2, no: 1 }[instinct] ?? 2
  const t = { now: 3, soon: 2, later: 1 }[timeframe] ?? 2
  const confidence = g + i
  const caution    = s + r
  const urgency    = t
  const raw   = ((confidence / 6) * 55) + ((1 - caution / 6) * 30) + ((urgency / 3) * 15)
  const score = Math.round(Math.max(0, Math.min(100, raw)))
  let verdict, colour, label
  if (score >= 72)      { verdict = 'Proceed';           colour = 'var(--green)'; label = 'The evidence points forward. Trust it.' }
  else if (score >= 50) { verdict = 'Proceed with care'; colour = 'var(--gold)';  label = 'Lean forward, but set a review point.' }
  else if (score >= 32) { verdict = 'Pause & reassess';  colour = 'var(--amber)'; label = 'Gather more information first.' }
  else                  { verdict = 'Reconsider';         colour = '#e05a5a';      label = "The conditions aren't right yet." }
  const insights = []
  if (r === 3 && s === 3) insights.push('High stakes + hard to reverse — this warrants deliberate thinking, not speed.')
  if (r === 1)            insights.push('Easy to reverse means low risk in just trying it.')
  if (g === 3)            insights.push("Strong regret signal. Your gut says you'd miss this deeply.")
  if (g === 1)            insights.push('Low regret suggests this may not matter as much as it currently feels.')
  if (i === 3 && g === 3) insights.push('Instinct and regret test agree, a rare alignment worth trusting.')
  if (i === 1 && g === 1) insights.push('Both instinct and regret test point away from this.')
  if (t === 3 && score < 50) insights.push('Urgency is real but clarity is low, set a hard deadline to force it.')
  if (s === 1)            insights.push('Low stakes means the cost of being wrong is small. Bias toward action.')
  if (insights.length === 0) insights.push('Mixed signals. use Pros & Cons for a deeper analysis.')
  return { score, verdict, colour, label, insights, confidence, caution, urgency }
}

// ── Canvas particle burst ────────────────────────────────────
function useParticles(canvasRef) {
  const particles = useRef([])
  const raf = useRef(null)
  const running = useRef(false)

  const loop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.current = particles.current.filter(p => p.alpha > 0.02)
    for (const p of particles.current) {
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      p.x += p.vx; p.y += p.vy
      p.vy += 0.09; p.vx *= 0.97
      p.alpha -= p.decay
    }
    if (particles.current.length > 0) {
      running.current = true
      raf.current = requestAnimationFrame(loop)
    } else { running.current = false }
  }, [canvasRef])

  const burst = useCallback((x, y, color) => {
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.5
      const speed = 1.8 + Math.random() * 4
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1,
        size: 2 + Math.random() * 4,
        color,
        decay: 0.014 + Math.random() * 0.014,
      })
    }
    if (!running.current) loop()
  }, [loop])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  return burst
}

// ── Score ring ───────────────────────────────────────────────
function ScoreRing({ score, colour, animate }) {
  const [n, setN] = useState(0)
  const size = 140, stroke = 9, r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r

  useEffect(() => {
    if (!animate) { setN(0); return }
    let frame, start = null
    const tick = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1400, 1)
      setN(Math.round((1 - Math.pow(1 - p, 4)) * score))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score, animate])

  const offset = circ - (n / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.ring}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colour} strokeWidth={stroke + 8} opacity="0.08"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colour} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke 0.5s' }} />
      <text x={size/2} y={size/2-7} textAnchor="middle" fill="var(--cream)" fontSize="30"
        fontFamily="'Playfair Display',serif" fontWeight="700">{n}</text>
      <text x={size/2} y={size/2+13} textAnchor="middle" fill="var(--muted)" fontSize="8.5"
        fontFamily="'DM Mono',monospace" letterSpacing="0.16em">CLARITY</text>
    </svg>
  )
}

// ── Choice button ────────────────────────────────────────────
function Choice({ label, sub, selected, onClick, colour, burst }) {
  const ref = useRef(null)
  return (
    <button ref={ref}
      className={`${styles.choice} ${selected ? styles.picked : ''}`}
      style={selected ? { borderColor: colour, background: `${colour}15`,
        boxShadow: `0 0 0 1px ${colour}30, 0 8px 28px rgba(0,0,0,0.3)` } : {}}
      onClick={() => {
        if (!selected && burst && ref.current) {
          const rect = ref.current.getBoundingClientRect()
          burst(rect.left + rect.width / 2, rect.top + rect.height / 2, colour)
        }
        onClick()
      }}>
      {selected && <span className={styles.tick} style={{ color: colour }}>✓</span>}
      <span className={styles.choiceLabel}>{label}</span>
      {sub && <span className={styles.choiceSub}>{sub}</span>}
    </button>
  )
}

// ── Progress ─────────────────────────────────────────────────
function Progress({ step }) {
  return (
    <div className={styles.progress}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`${styles.seg}
          ${i < step ? styles.segDone : ''}
          ${i === step ? styles.segActive : ''}`}>
          <div className={styles.segFill} />
        </div>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
const NAMES = ['The Decision', 'Stakes', 'Reversibility', 'Final Tests', 'Clarity Score']
const G = 'var(--green)', GOLD = 'var(--gold)', RED = '#e05a5a', PUR = '#8b6dd1'

export default function ClarityEnginePage() {
  const [step, setStep]         = useState(0)
  const [phase, setPhase]       = useState('enter')
  const [result, setResult]     = useState(null)
  const [ringAnim, setRingAnim] = useState(false)
  const [fills, setFills]       = useState([0, 0, 0])
  const [glow, setGlow]         = useState('rgba(139,109,209,0.12)')

  const [decision,      setDecision]      = useState('')
  const [stakes,        setStakes]        = useState('')
  const [reversibility, setReversibility] = useState('')
  const [regret,        setRegret]        = useState('')
  const [instinct,      setInstinct]      = useState('')
  const [timeframe,     setTimeframe]     = useState('')

  const canvasRef = useRef(null)
  const burst = useParticles(canvasRef)

  // Resize canvas to full screen
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width  = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Glow per step
  useEffect(() => {
    const glows = [
      'rgba(139,109,209,0.12)', 'rgba(224,90,90,0.09)',
      'rgba(201,168,76,0.10)',  'rgba(78,173,122,0.09)',
      'rgba(201,168,76,0.14)',
    ]
    setGlow(glows[step] ?? glows[0])
  }, [step])

  const transition = fn => {
    setPhase('leave')
    setTimeout(() => { fn(); setPhase('enter') }, 230)
  }

  const goNext = () => transition(() => setStep(s => s + 1))
  const goBack = () => transition(() => setStep(s => Math.max(0, s - 1)))

  useEffect(() => {
    if (step !== 4) { setRingAnim(false); setFills([0,0,0]); return }
    const r = computeScore({ stakes, reversibility, regret, instinct, timeframe })
    setResult(r)
    setTimeout(() => setRingAnim(true), 250)
    setTimeout(() => setFills([r.confidence, r.caution, r.urgency]), 550)
    setTimeout(() => burst(window.innerWidth / 2, window.innerHeight * 0.4, r.colour), 300)
  }, [step])

  const reset = () => transition(() => {
    setStep(0); setResult(null); setRingAnim(false); setFills([0,0,0])
    setDecision(''); setStakes(''); setReversibility('')
    setRegret(''); setInstinct(''); setTimeframe('')
  })

  const canNext = [
    decision.trim().length > 0, stakes !== '',
    reversibility !== '',
    regret !== '' && instinct !== '' && timeframe !== '',
  ][step] ?? false

  return (
    <div className="page">
      {/* Full-screen particle canvas */}
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className="c-sm">
        <PageHeader num="✦ Tool 05" title="Clarity Engine"
          sub="A structured 60-second framework that scores your decision so you stop going in circles." />

        <Progress step={step} />
        <div className={styles.stepMeta}>
          <span className={styles.stepN}>Step {Math.min(step+1,5)} / 5</span>
          <span className={styles.stepName}>{NAMES[step]}</span>
        </div>

        {/* ── Card ── */}
        <div className={`card card-body ${styles.card} ${styles[phase]}`}>
          <div className={styles.cardGlow} style={{ background: glow }} />

          {/* Step 0 */}
          {step === 0 && (
            <div className={styles.stepBody}>
              <p className={styles.q}>What decision are you facing?</p>
              <p className={styles.qsub}>Be specific. <em>"Accept job offer at Company X"</em> beats <em>"career stuff"</em>.</p>
              <textarea className={`input ${styles.textarea}`}
                value={decision} onChange={e => setDecision(e.target.value)}
                placeholder="e.g. Should I quit my job to freelance full-time?"
                maxLength={200} autoFocus
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey && decision.trim()) { e.preventDefault(); goNext() }}} />
              <p className={styles.charcount}>{decision.length} / 200</p>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className={styles.stepBody}>
              <p className={styles.q}>What are the stakes?</p>
              <p className={styles.qsub}>How much does getting this wrong actually cost you?</p>
              <div className={styles.choices}>
                {[
                  { v:'low',    l:'Low',    c:G,    s:'Easily absorbed. Minor setback at worst.' },
                  { v:'medium', l:'Medium', c:GOLD, s:'Significant but recoverable.' },
                  { v:'high',   l:'High',   c:RED,  s:'Major consequences — finances, health, career.' },
                ].map(o => <Choice key={o.v} label={o.l} sub={o.s} colour={o.c}
                  selected={stakes===o.v} onClick={()=>setStakes(o.v)} burst={burst} />)}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className={styles.stepBody}>
              <p className={styles.q}>How reversible is this?</p>
              <p className={styles.qsub}>Bezos calls these Type 1 vs Type 2 decisions. Can you walk it back?</p>
              <div className={styles.choices}>
                {[
                  { v:'easy',     l:'Easy to reverse',       c:G,    s:'Undo it with little cost or effort.' },
                  { v:'moderate', l:'Moderately reversible',  c:GOLD, s:'Possible but costs time, money or credibility.' },
                  { v:'hard',     l:'Hard to reverse',        c:RED,  s:"One-way door. Very difficult to undo." },
                ].map(o => <Choice key={o.v} label={o.l} sub={o.s} colour={o.c}
                  selected={reversibility===o.v} onClick={()=>setReversibility(o.v)} burst={burst} />)}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className={styles.stepBody}>
              <div className={styles.subSection}>
                <p className={styles.q}>The Regret Test</p>
                <p className={styles.qsub}>10 years from now — would you regret <em>not</em> doing this?</p>
                <div className={styles.choicesRow}>
                  {[{v:'yes',l:'Yes, deeply',c:RED},{v:'maybe',l:'Maybe',c:GOLD},{v:'no',l:'Not really',c:G}].map(o => (
                    <Choice key={o.v} label={o.l} colour={o.c} selected={regret===o.v} onClick={()=>setRegret(o.v)} burst={burst} />
                  ))}
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.subSection}>
                <p className={styles.q}>Your gut says…</p>
                <p className={styles.qsub}>Before analysis — what does instinct tell you right now?</p>
                <div className={styles.choicesRow}>
                  {[{v:'yes',l:'Do it',c:G},{v:'unsure',l:'Unsure',c:GOLD},{v:'no',l:"Don't",c:RED}].map(o => (
                    <Choice key={o.v} label={o.l} colour={o.c} selected={instinct===o.v} onClick={()=>setInstinct(o.v)} burst={burst} />
                  ))}
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.subSection}>
                <p className={styles.q}>How urgent is this?</p>
                <p className={styles.qsub}>When does a decision actually need to be made?</p>
                <div className={styles.choicesRow}>
                  {[{v:'now',l:'Right now',c:RED},{v:'soon',l:'Days / weeks',c:GOLD},{v:'later',l:'Months away',c:G}].map(o => (
                    <Choice key={o.v} label={o.l} colour={o.c} selected={timeframe===o.v} onClick={()=>setTimeframe(o.v)} burst={burst} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Result */}
          {step === 4 && result && (
            <div className={styles.result}>
              <div className={styles.echo}>
                <span className={styles.echoLabel}>Decision analysed</span>
                <p className={styles.echoText}>"{decision}"</p>
              </div>
              <div className={styles.scoreRow}>
                <ScoreRing score={result.score} colour={result.colour} animate={ringAnim} />
                <div className={styles.verdict}>
                  <span className={styles.verdictLabel}>Verdict</span>
                  <span className={styles.verdictText} style={{ color: result.colour }}>{result.verdict}</span>
                  <p className={styles.verdictSub}>{result.label}</p>
                </div>
              </div>
              <div className={styles.subscores}>
                {[
                  { label:'Confidence', val:fills[0], max:6, color:G    },
                  { label:'Caution',    val:fills[1], max:6, color:RED   },
                  { label:'Urgency',    val:fills[2], max:3, color:PUR   },
                ].map((s, i) => (
                  <div key={s.label} className={styles.subscore}>
                    <div className={styles.ssHead}>
                      <span className={styles.ssLabel}>{s.label}</span>
                      <span className={styles.ssVal}>{s.val}/{s.max}</span>
                    </div>
                    <div className={styles.ssTrack}>
                      <div className={styles.ssFill} style={{
                        width: `${(s.val/s.max)*100}%`, background: s.color,
                        transition: `width 0.9s cubic-bezier(.4,0,.2,1) ${i*0.15}s`
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.insights}>
                <span className={styles.insightsLabel}>Key Insights</span>
                {result.insights.map((ins, i) => (
                  <div key={i} className={styles.insight} style={{ animationDelay: `${0.35 + i * 0.1}s` }}>
                    <span className={styles.insightDot} style={{ color: result.colour }}>✦</span>
                    <span className={styles.insightText}>{ins}</span>
                  </div>
                ))}
              </div>
              <div className={styles.resultActions}>
                <button className="btn-outline" onClick={reset}>↺ New Decision</button>
                <a href="/pros-cons" className="btn-outline" style={{ textAlign:'center', flex:1 }}>⚖ Deep dive →</a>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        {step < 4 && (
          <div className={styles.nav}>
            {step > 0 && <button className="btn-outline" onClick={goBack}
              style={{ transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateX(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>
              ← Back
            </button>}
            <button className="btn-gold" style={{ flex:1, fontSize:16 }}
              onClick={goNext} disabled={!canNext}>
              {step === 3 ? '✦ Calculate Score' : 'Continue →'}
            </button>
          </div>
        )}

        {/* <p className={styles.footer}>
          Based on regret minimisation theory, reversibility frameworks & instinct calibration.
        </p> */}
      </div>
    </div>
  )
}