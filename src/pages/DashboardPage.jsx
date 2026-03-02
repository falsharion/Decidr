import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { lsGet, WEEK_DAYS, currentWeekStart, todayWeekDay } from '../lib/utils'
import styles from './Dashboardpage.module.css'

// ── Data readers ─────────────────────────────────────────────
function readWeekPlan() {
  const stored = lsGet('decidr-week', null)
  if (!stored || stored.weekStart !== currentWeekStart()) {
    return { tasks: [], goals: [] }
  }
  return stored
}

function readHistory() {
  return lsGet('decidr-history', [])
}

function readAIUsage() {
  const usage = lsGet('decidr-ai-usage', null)
  const today = new Date().toISOString().slice(0, 10)
  if (!usage || usage.date !== today) return 0
  return usage.count || 0
}

function readStreakData() {
  // streak stored as { weeks: [{ weekStart, pct }] }
  return lsGet('decidr-streak', { weeks: [] })
}

// ── Mini Ring SVG ─────────────────────────────────────────────
function RingChart({ pct, size = 52, stroke = 5, color = 'var(--gold)', bg = 'var(--border)', label }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.ring}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
      />
      {label && (
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          fill="var(--gold-lt)" fontSize={size * 0.18}
          fontFamily="DM Mono, monospace" fontWeight="600">
          {label}
        </text>
      )}
    </svg>
  )
}

// ── Tool icons & routes ───────────────────────────────────────
const TOOL_META = {
  coin:       { icon: '🪙', label: 'The Coin',    to: '/coin'      },
  'pros-cons':{ icon: '⚖',  label: 'Pros & Cons', to: '/pros-cons' },
  bracket:    { icon: '🥊', label: 'The Bracket', to: '/bracket'   },
  planner:    { icon: '📅', label: 'Planner',     to: '/planner'   },
}

// ── Dashboard ─────────────────────────────────────────────────
export default function DashboardPage() {
  const plan    = useMemo(readWeekPlan,  [])
  const history = useMemo(readHistory,   [])
  const aiUsed  = useMemo(readAIUsage,   [])
  const AI_MAX  = 30
  const aiPct   = Math.round((aiUsed / AI_MAX) * 100)

  const tasks = plan.tasks || []
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'done').length
  const left  = total - done
  const weekPct = total ? Math.round((done / total) * 100) : 0

  // Priority health
  const high = tasks.filter(t => t.priority === 'high').length
  const med  = tasks.filter(t => t.priority === 'medium').length
  const low  = tasks.filter(t => t.priority === 'low').length

  // Best day
  const today = todayWeekDay()
  const bestDay = useMemo(() => {
    let best = null, bestCount = 0
    for (const d of WEEK_DAYS) {
      const dayTasks = tasks.filter(t => t.day === d)
      const dayDone  = dayTasks.filter(t => t.status === 'done').length
      if (dayDone > bestCount) { bestCount = dayDone; best = d }
    }
    return best ? { day: best, count: bestCount } : null
  }, [tasks])

  // Streak — read stored weeks, compute consecutive >= 70% ending today
  const streakData = useMemo(readStreakData, [])
  const streak = useMemo(() => {
    const weeks = [...(streakData.weeks || [])]
    // Include current week if data exists
    if (total > 0) {
      const thisWeek = { weekStart: currentWeekStart(), pct: weekPct }
      const existing = weeks.findIndex(w => w.weekStart === currentWeekStart())
      if (existing >= 0) weeks[existing] = thisWeek
      else weeks.push(thisWeek)
    }
    // Count consecutive from end
    let count = 0
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].pct >= 70) count++
      else break
    }
    return count
  }, [streakData, weekPct, total])

  // Recent history (last 5)
  const recent = useMemo(() => [...history].reverse().slice(0, 5), [history])

  // Quick stats row
  const stats = [
    { n: total,    l: 'Tasks',     color: 'var(--cream)' },
    { n: done,     l: 'Done',      color: 'var(--green)' },
    { n: left,     l: 'Remaining', color: 'var(--amber)' },
    { n: plan.goals?.length ?? 0, l: 'Goals', color: 'var(--gold-lt)' },
  ]

  return (
    <div className="page">
      <div className="c">

        {/* ── Header ──────────────────────────────────────── */}
        <div className={`${styles.header} anim-up`}>
          <div>
            <p className={styles.eyebrow}>✦ Overview</p>
            <h1 className={styles.title}>Dashboard</h1>
          </div>
          <div className={styles.headerLinks}>
            <Link to="/planner" className="btn-outline" style={{ fontSize: 12 }}>Open Planner →</Link>
          </div>
        </div>

        {/* ── Top grid: Ring + Priority + AI Usage ─────────── */}
        <div className={`${styles.topGrid} anim-up`} style={{ animationDelay: '0.05s' }}>

          {/* Completion ring */}
          <div className={`card card-body ${styles.ringCard}`}>
            <div className={styles.cardLabel}>This Week</div>
            <div className={styles.ringWrap}>
              <RingChart pct={weekPct} size={90} stroke={8} label={`${weekPct}%`}
                color={weekPct >= 70 ? 'var(--green)' : weekPct >= 40 ? 'var(--gold)' : 'var(--amber)'} />
              <div className={styles.ringStats}>
                {stats.map((s, i) => (
                  <div key={i} className={styles.ringStat}>
                    <span className={styles.ringStatN} style={{ color: s.color }}>{s.n}</span>
                    <span className={styles.ringStatL}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            {total === 0 && (
              <p className={styles.emptyHint}>No tasks yet — <Link to="/planner" className={styles.emptyLink}>open planner</Link></p>
            )}
          </div>

          {/* Priority health */}
          <div className={`card card-body ${styles.priorityCard}`}>
            <div className={styles.cardLabel}>Priority Health</div>
            <div className={styles.priRows}>
              {[
                { label: 'High',   count: high, color: '#e05a5a', badge: 'badge-red'   },
                { label: 'Medium', count: med,  color: 'var(--amber)', badge: 'badge-amber' },
                { label: 'Low',    count: low,  color: 'var(--green)', badge: 'badge-green' },
              ].map(p => {
                const pct = total ? Math.round((p.count / total) * 100) : 0
                return (
                  <div key={p.label} className={styles.priRow}>
                    <div className={styles.priRowHead}>
                      <span className={`badge ${p.badge}`} style={{ fontSize: 9, padding: '2px 6px' }}>{p.label}</span>
                      <span className={styles.priCount}>{p.count}</span>
                    </div>
                    <div className={styles.priTrack}>
                      <div className={styles.priFill} style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                  </div>
                )
              })}
              {total === 0 && <p className={styles.emptyHint}>No tasks to analyze</p>}
            </div>
          </div>

          {/* AI usage */}
          <div className={`card card-body ${styles.aiCard}`}>
            <div className={styles.cardLabel}>AI Usage Today</div>
            <div className={styles.aiWrap}>
              <RingChart pct={aiPct} size={72} stroke={6} label={`${aiUsed}`}
                color={aiUsed >= AI_MAX ? '#e05a5a' : aiUsed > AI_MAX * 0.7 ? 'var(--amber)' : 'var(--purple)'}
                bg="rgba(139,109,209,0.12)" />
              <div className={styles.aiMeta}>
                <span className={styles.aiNum}>{aiUsed}<span className={styles.aiDen}> / {AI_MAX}</span></span>
                <span className={styles.aiLabel}>requests</span>
                <span className={`badge ${aiUsed >= AI_MAX ? 'badge-red' : 'badge-purple'}`} style={{ fontSize: 9, marginTop: 4 }}>
                  {aiUsed >= AI_MAX ? 'Limit reached' : `${AI_MAX - aiUsed} left`}
                </span>
              </div>
            </div>
            <div className={styles.priTrack} style={{ marginTop: 12 }}>
              <div className={styles.priFill} style={{
                width: `${aiPct}%`,
                background: aiUsed >= AI_MAX ? '#e05a5a' : 'var(--purple)',
                transition: 'width 0.8s cubic-bezier(.4,0,.2,1)'
              }} />
            </div>
          </div>

        </div>

        {/* ── Middle row: Best Day + Streak ────────────────── */}
        <div className={`${styles.midGrid} anim-up`} style={{ animationDelay: '0.1s' }}>

          {/* Best day */}
          <div className={`card card-body ${styles.bestDayCard}`}>
            <div className={styles.cardLabel}>Best Day This Week</div>
            {bestDay ? (
              <div className={styles.bestDayContent}>
                <span className={styles.bestDayName}>{bestDay.day}</span>
                <div className={styles.bestDayMeta}>
                  <span className={styles.bestDayNum}>{bestDay.count}</span>
                  <span className={styles.bestDayL}>tasks completed</span>
                </div>
              </div>
            ) : (
              <p className={styles.emptyHint}>Complete tasks to see your best day</p>
            )}

            {/* Mini day bars */}
            {total > 0 && (
              <div className={styles.dayBars}>
                {WEEK_DAYS.map(d => {
                  const dt    = tasks.filter(t => t.day === d)
                  const dd    = dt.filter(t => t.status === 'done').length
                  const dpct  = dt.length ? Math.round((dd / dt.length) * 100) : 0
                  const isB   = bestDay && bestDay.day === d
                  const isTdy = d === today
                  return (
                    <div key={d} className={styles.dayBar}>
                      <div className={styles.dayBarTrack}>
                        <div className={styles.dayBarFill} style={{
                          height: `${dpct}%`,
                          background: isB ? 'var(--gold)' : isTdy ? 'var(--purple)' : 'var(--green)',
                          opacity: dt.length === 0 ? 0.15 : 1
                        }} />
                      </div>
                      <span className={`${styles.dayBarLabel} ${isB ? styles.dayBarLabelBest : ''} ${isTdy ? styles.dayBarLabelToday : ''}`}>{d}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Weekly streak */}
          <div className={`card card-body ${styles.streakCard}`}>
            <div className={styles.cardLabel}>Weekly Streak</div>
            <div className={styles.streakContent}>
              <div className={styles.streakFire}>
                <span className={styles.streakEmoji}>{streak >= 3 ? '🔥' : streak >= 1 ? '✦' : '—'}</span>
                <span className={styles.streakNum}>{streak}</span>
              </div>
              <div className={styles.streakRight}>
                <span className={styles.streakL}>consecutive week{streak !== 1 ? 's' : ''}</span>
                <span className={styles.streakSub}>above 70% completion</span>
                {streak === 0 && <span className={`badge badge-amber`} style={{ fontSize: 9, marginTop: 6, display: 'inline-flex' }}>Hit 70% to start</span>}
                {streak >= 1 && <span className={`badge badge-gold`} style={{ fontSize: 9, marginTop: 6, display: 'inline-flex' }}>🔥 On a roll</span>}
              </div>
            </div>
            {/* Streak dots */}
            <div className={styles.streakDots}>
              {[...Array(Math.max(streak, 5))].slice(0, 8).map((_, i) => (
                <div key={i} className={`${styles.streakDot} ${i < streak ? styles.streakDotActive : ''}`} />
              ))}
            </div>
          </div>

        </div>

        {/* ── Recent Decisions ─────────────────────────────── */}
        <div className={`card card-body ${styles.histCard} anim-up`} style={{ animationDelay: '0.15s' }}>
          <div className={styles.histHead}>
            <span className={styles.cardLabel}>Recent Decisions</span>
            {history.length > 0 && (
              <Link to="/history" className={styles.histAll}>View all →</Link>
            )}
          </div>

          {recent.length === 0 ? (
            <div className={styles.histEmpty}>
              <span className={styles.histEmptyIcon}>✦</span>
              <p>No decisions yet. Try a tool below.</p>
              <div className={styles.histToolLinks}>
                {Object.entries(TOOL_META).map(([key, t]) => (
                  <Link key={key} to={t.to} className={styles.histToolChip}>
                    {t.icon} {t.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.histList}>
              {recent.map((entry, i) => {
                const meta = TOOL_META[entry.tool] ?? { icon: '✦', label: entry.tool, to: '/' }
                const ts   = entry.createdAt ? new Date(entry.createdAt) : null
                const timeStr = ts ? ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null
                const dateStr = ts ? ts.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null
                return (
                  <div key={entry.id ?? i}
                    className={`${styles.histRow} anim-up`}
                    style={{ animationDelay: `${0.15 + i * 0.04}s` }}>
                    <div className={styles.histIcon}>{meta.icon}</div>
                    <div className={styles.histBody}>
                      <span className={styles.histTool}>{meta.label}</span>
                      <span className={styles.histResult}>{entry.result}</span>
                    </div>
                    {(timeStr || dateStr) && (
                      <div className={styles.histTime}>
                        {dateStr && <span>{dateStr}</span>}
                        {timeStr && <span>{timeStr}</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Quick access tools ──────────────────────────── */}
        <div className={`${styles.quickGrid} anim-up`} style={{ animationDelay: '0.2s' }}>
          {Object.entries(TOOL_META).map(([key, t], i) => (
            <Link key={key} to={t.to}
              className={`card card-body ${styles.quickCard}`}
              style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
              <span className={styles.quickIcon}>{t.icon}</span>
              <span className={styles.quickLabel}>{t.label}</span>
              <span className={styles.quickArrow}>→</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}