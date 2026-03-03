import { useState } from 'react'
import AIBlock from '../components/ui/AIBlock'
import Toast from '../components/ui/Toast'
import { useWeekPlan } from '../hooks/useWeekPlan'
import { useAI } from '../hooks/useAI'
import { useToast } from '../hooks/useToast'
import { weeklyReviewPrompt } from '../lib/prompts'
import { WEEK_DAYS, DAY_LABELS, todayWeekDay, formatWeekRange, uid } from '../lib/utils'
import styles from './Plannerpage.module.css'

const PRI_BADGE = { high: 'badge-red', medium: 'badge-amber', low: 'badge-green' }
const PRI_EMOJI = { high: '🔴', medium: '🟡', low: '🟢' }
const PRI_LABEL = { high: 'High', medium: 'Med', low: 'Low' }

// ── Locked task (read-only past day) ─────────────────────
function LockedTaskRow({ task }) {
  return (
    <div className={`${styles.taskRow} ${styles.lockedTask} ${task.status === 'done' ? styles.done : ''}`}>
      <span className={`${styles.checkBtn} ${task.status === 'done' ? styles.checked : styles.checkLocked}`} aria-hidden="true">
        {task.status === 'done' ? '✓' : ''}
      </span>
      <span className={styles.taskText}>{task.text}</span>
      <span className={`badge ${PRI_BADGE[task.priority]} ${styles.taskBadge}`}>{PRI_LABEL[task.priority]}</span>
    </div>
  )
}

// ── Task row with inline edit ─────────────────────────────
function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text, setText]       = useState(task.text)
  const [pri, setPri]         = useState(task.priority)

  const save = () => { if (text.trim()) { onEdit(text.trim(), pri); setEditing(false) } }
  const cancel = () => { setText(task.text); setPri(task.priority); setEditing(false) }

  if (editing) return (
    <div className={`${styles.taskRow} ${styles.taskEditing} anim-slide`}>
      <input className={`input ${styles.editInput}`} value={text} autoFocus
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} />
      <select className={`input ${styles.priSelect}`} value={pri} onChange={e => setPri(e.target.value)}>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <div className="flex gap-4">
        <button className="btn-outline" style={{ padding: '6px 11px', fontSize: 11 }} onClick={save}>Save</button>
        <button className="btn-outline" style={{ padding: '6px 11px', fontSize: 11 }} onClick={cancel}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div className={`${styles.taskRow} ${task.status === 'done' ? styles.done : ''} anim-slide`}>
      <button className={`${styles.checkBtn} ${task.status === 'done' ? styles.checked : ''}`}
        onClick={onToggle} aria-label={`Mark "${task.text}" as ${task.status === 'done' ? 'incomplete' : 'done'}`}>
        {task.status === 'done' ? '✓' : ''}
      </button>
      <span className={styles.taskText}>{task.text}</span>
      <span className={`badge ${PRI_BADGE[task.priority]} ${styles.taskBadge}`} title={`Priority: ${task.priority}`}>
        {PRI_LABEL[task.priority]}
      </span>
      <div className={`flex gap-4 ${styles.taskActions}`}>
        <button className="btn-icon edit" onClick={() => setEditing(true)} aria-label={`Edit task: ${task.text}`}>✎</button>
        <button className="btn-icon"      onClick={onDelete}               aria-label={`Delete task: ${task.text}`}>×</button>
      </div>
    </div>
  )
}

// ── Inline add form ───────────────────────────────────────
function AddTaskInline({ day, onAdd }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [pri, setPri]   = useState('medium')

  const submit = () => {
    if (!text.trim()) return
    onAdd(day, text.trim(), pri)
    setText(''); setPri('medium'); setOpen(false)
  }

  if (!open) return (
    <button className={`btn-ghost-add ${styles.addTaskBtn}`} onClick={() => setOpen(true)}>+ Add task</button>
  )

  return (
    <div className={`${styles.addForm} anim-slide`}>
      <input className="input" value={text} autoFocus
        onChange={e => setText(e.target.value)}
        placeholder="Task description..."
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        maxLength={140}
      />
      <div className={styles.addFormRow}>
        <select className={`input ${styles.priSelect}`} value={pri} onChange={e => setPri(e.target.value)}>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        <button className="btn-outline" style={{ padding: '8px 14px', fontSize: 11 }} onClick={submit} disabled={!text.trim()}>Add</button>
        <button className="btn-outline" style={{ padding: '8px 12px', fontSize: 11 }} onClick={() => setOpen(false)}>✕</button>
      </div>
    </div>
  )
}

// ── Day column ────────────────────────────────────────────
function DayColumn({ dayKey, label, tasks, isToday, isPast, isLocked, onToggle, onEdit, onDelete, onAdd }) {
  const done  = tasks.filter(t => t.status === 'done').length
  const total = tasks.length
  const pct   = total ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <div className={`card ${styles.dayCol}
      ${isToday   ? styles.todayCol   : ''}
      ${isLocked  ? styles.lockedCol  : ''}
      ${isPast && !isLocked ? styles.pastCol : ''}
      ${allDone   ? styles.allDoneCol : ''}
    `}>
      {/* Locked overlay banner */}
      {isLocked && (
        <div className={styles.lockedBanner}>
          <span className={styles.lockIcon} aria-hidden="true">🔒</span>
          <span className={styles.lockedLabel}>Day passed</span>
        </div>
      )}

      <div className={styles.dayHead}>
        <div>
          <div className={styles.dayName}>
            {label}
            {isToday  && <span className="badge badge-gold"   style={{ marginLeft: 7, fontSize: 8 }}>Today</span>}
            {isLocked && <span className={styles.pastBadge}>Past</span>}
          </div>
          {total > 0 && (
            <div className={styles.dayCount}>
              <span style={{ color: allDone ? 'var(--green)' : 'inherit' }}>{done}</span>/{total}
              {allDone && <span className={styles.allDoneCheck}> ✓</span>}
            </div>
          )}
        </div>
        {total > 0 && (
          <div className="progress-track" style={{ width: 36, height: 3 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: allDone ? 'var(--green)' : undefined }} />
          </div>
        )}
      </div>

      <div className={styles.taskList}>
        {tasks.length === 0 && (
          <p className={styles.emptyDay}>
            {isPast ? 'Nothing logged' : 'No tasks yet'}
          </p>
        )}
        {tasks.map(t => isLocked
          ? <LockedTaskRow key={t.id} task={t} />
          : <TaskRow key={t.id} task={t}
              onToggle={() => onToggle(t.id)}
              onEdit={(txt, pri) => onEdit(t.id, { text: txt, priority: pri })}
              onDelete={() => onDelete(t.id)} />
        )}
      </div>

      {/* Only show add form on non-locked days */}
      {!isLocked && <AddTaskInline day={dayKey} onAdd={onAdd} />}

      {/* Locked footer */}
      {isLocked && tasks.length > 0 && (
        <p className={styles.lockedFooter}>
          Clear week to unlock editing
        </p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function PlannerPage() {
  const { plan, stats, dayBreakdown, lockedDays, pastDays, addGoal, updateGoal, deleteGoal, addTask, updateTask, deleteTask, toggleTask, clearWeek } = useWeekPlan()
  const { loading, text, error, ask, reset: resetAI, remaining, exceeded, dailyMax } = useAI()
  const { toast, show } = useToast()

  const [newGoal, setNewGoal]           = useState('')
  const [editGoalId, setEditGoalId]     = useState(null)
  const [editGoalText, setEditGoalText] = useState('')
  const [view, setView]                 = useState('week')
  const [activeDay, setActiveDay]       = useState(todayWeekDay())
  const [showReview, setShowReview]     = useState(false)

  const today    = todayWeekDay()
  const dispDays = view === 'day' ? [activeDay] : WEEK_DAYS

  const submitGoal = () => { if (!newGoal.trim()) return; addGoal(newGoal.trim()); setNewGoal('') }
  const saveGoalEdit = (id) => { updateGoal(id, editGoalText); setEditGoalId(null) }

  const runReview = async () => {
    if (exceeded) { show(`Daily AI limit reached (${dailyMax}/day) — come back tomorrow!`); return }
    setShowReview(true); resetAI()
    await ask(weeklyReviewPrompt(plan.goals, plan.tasks, stats.done, stats.total, stats.pct, dayBreakdown))
  }

  // Progress ring data
  const ringR  = 20
  const ringC  = 2 * Math.PI * ringR
  const ringOffset = ringC - (stats.pct / 100) * ringC

  return (
    <div className="page">
      <div className="c">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className={styles.planHead}>
          <div className="anim-up">
            <p className="eyebrow mb-8">📅 Week Planner(Beta)</p>
            <h1 className={styles.planTitle}>Your Week</h1>
            <p className={styles.weekRange}>{formatWeekRange(plan.weekStart)}</p>
          </div>

          <div className={`card card-body ${styles.statsBox} anim-up delay-1`}>
            {/* SVG ring progress */}
            <div className={styles.statsInner}>
              <svg className={styles.ringChart} width="52" height="52" viewBox="0 0 52 52" aria-label={`${stats.pct}% complete`}>
                <circle cx="26" cy="26" r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle cx="26" cy="26" r={ringR} fill="none" stroke="var(--gold)" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 26 26)"
                  style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                />
                <text x="26" y="30" textAnchor="middle" fill="#e8c97a"
                  fontSize="10" fontFamily="DM Mono, monospace" fontWeight="600">
                  {stats.pct}%
                </text>
              </svg>
              <div className={styles.statsNums}>
                {[{ n: stats.done, l: 'Done' }, { n: stats.total - stats.done, l: 'Left' }].map((s, i) => (
                  <div key={i} className={styles.stat}>
                    <span className={styles.statN}>{s.n}</span>
                    <span className={styles.statL}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Persistence notice (only shown once, then dismissed) */}
        {/* {plan.tasks.length === 0 && plan.goals.length === 0 && (
          <div className={styles.persistNotice}>
            <span aria-hidden="true">💾</span>
            <span>Everything you add is auto-saved — it'll still be here when you come back.</span>
          </div>
        )} */}

        {/* ── Goals ──────────────────────────────────────────── */}
        <div className={`card card-body ${styles.goalsCard} anim-up`}>
          <div className={styles.goalsSectionHead}>
            <span className="section-label">Weekly Goals</span>
            {plan.goals.length > 0 && (
              <span className={styles.goalCount}>{plan.goals.length} goal{plan.goals.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {plan.goals.length === 0 && (
            <p className="text-muted mb-12" style={{ fontSize: 13 }}>
              No goals yet — add one to anchor your week.
            </p>
          )}

          <div className={styles.goalList}>
            {plan.goals.map(g => (
              <div key={g.id} className={styles.goalRow}>
                {editGoalId === g.id ? (
                  <>
                    <input className={`input ${styles.goalInput}`} value={editGoalText} autoFocus
                      onChange={e => setEditGoalText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveGoalEdit(g.id); if (e.key === 'Escape') setEditGoalId(null) }}
                    />
                    <button className="btn-outline" style={{ padding: '7px 12px', fontSize: 11 }} onClick={() => saveGoalEdit(g.id)}>Save</button>
                    <button className="btn-outline" style={{ padding: '7px 12px', fontSize: 11 }} onClick={() => setEditGoalId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className={styles.goalDot} aria-hidden="true">✦</span>
                    <span className={styles.goalText}>{g.text}</span>
                    <button className="btn-icon edit" onClick={() => { setEditGoalId(g.id); setEditGoalText(g.text) }} aria-label={`Edit goal: ${g.text}`}>✎</button>
                    <button className="btn-icon" onClick={() => deleteGoal(g.id)} aria-label={`Delete goal: ${g.text}`}>×</button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className={styles.goalAdd}>
            <input className="input" value={newGoal} onChange={e => setNewGoal(e.target.value)}
              placeholder="Add a weekly goal..." maxLength={160}
              onKeyDown={e => e.key === 'Enter' && submitGoal()} />
            <button className="btn-outline" onClick={submitGoal} disabled={!newGoal.trim()} style={{ whiteSpace: 'nowrap' }}>
              Add Goal
            </button>
          </div>
        </div>

        {/* ── View controls ──────────────────────────────────── */}
        <div className={`${styles.viewBar} anim-up`}>
          <div className="tabs" style={{ maxWidth: 200 }}>
            <button className={`tab${view === 'week' ? ' active' : ''}`} onClick={() => setView('week')}>Week</button>
            <button className={`tab${view === 'day' ? ' active' : ''}`}  onClick={() => setView('day')}>Day</button>
          </div>
          {view === 'day' && (
            <div className={styles.dayPicker}>
              {WEEK_DAYS.map(d => (
                <button key={d}
                  className={`${styles.dayTab}
                    ${activeDay === d ? styles.dayTabActive : ''}
                    ${today === d     ? styles.dayTabToday  : ''}
                    ${lockedDays.has(d) ? styles.dayTabLocked : ''}
                    ${pastDays.has(d) && !lockedDays.has(d) ? styles.dayTabPast : ''}
                  `}
                  onClick={() => setActiveDay(d)}
                  aria-label={`${d}${lockedDays.has(d) ? ' (locked)' : today === d ? ' (today)' : ''}`}
                  aria-pressed={activeDay === d}
                >
                  {d}
                  {lockedDays.has(d) && <span className={styles.dayTabLockDot} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Day grid ───────────────────────────────────────── */}
        <div className={`${styles.daysGrid} ${view === 'day' ? styles.singleDay : ''}`}>
          {dispDays.map((d, i) => {
            const dayKey    = d
            const dayTasks  = plan.tasks.filter(t => t.day === d)
            const isToday   = d === today
            const isPast    = pastDays.has(d)
            const isLocked  = lockedDays.has(d)

            return (
              <div key={d} className="anim-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <DayColumn
                  dayKey={dayKey}
                  label={view === 'day' ? DAY_LABELS[d] : d}
                  tasks={dayTasks}
                  isToday={isToday}
                  isPast={isPast}
                  isLocked={isLocked}
                  onToggle={toggleTask}
                  onEdit={updateTask}
                  onDelete={deleteTask}
                  onAdd={addTask}
                />
              </div>
            )
          })}
        </div>

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className={`${styles.bottomBar} anim-up`}>
          <button className={`btn-gold ${styles.reviewBtn}`} onClick={runReview} aria-label="Get AI weekly review">
            ✦ AI Weekly Review
          </button>
          <button className="btn-outline" onClick={() => {
            if (window.confirm('Clear all tasks and goals for this week? This will also unlock past days.')) clearWeek()
          }}>
            Clear Week
          </button>
        </div>

        {/* ── AI Review ──────────────────────────────────────── */}
        {showReview && (
          <div className="result-card anim-scale mt-16" role="region" aria-label="AI weekly review">
            <div className="result-glow" />
            <div className="result-eyebrow">AI Weekly Review</div>

            <div className={styles.reviewStats}>
              {[
                { n: `${stats.pct}%`, l: 'Completion', gold: true },
                { n: stats.done,      l: 'Done' },
                { n: stats.total - stats.done, l: 'Remaining' },
              ].map((s, i) => (
                <div key={i} className={styles.reviewStat}>
                  <span className={styles.reviewBigNum} style={{ color: s.gold ? 'var(--gold-lt)' : undefined }}>{s.n}</span>
                  <span className={styles.reviewStatLabel}>{s.l}</span>
                </div>
              ))}
            </div>

            <div className="progress-track mt-12 mb-4" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${stats.pct}%` }} />
            </div>

            <AIBlock loading={loading} text={text} error={error} label="✦ Groq Weekly Review" remaining={remaining} dailyMax={dailyMax} />

            {!loading && (
              <button className="btn-outline mt-16" onClick={() => { setShowReview(false); resetAI() }}>
                Close Review
              </button>
            )}
          </div>
        )}
      </div>
      <Toast message={toast} />
    </div>
  )
}