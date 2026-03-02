import { useState, useCallback, useMemo } from 'react'
import { uid, currentWeekStart, WEEK_DAYS, todayWeekDay, lsGet, lsSet } from '../lib/utils'

const KEY = 'decidr-week'

function emptyPlan() {
  return { weekStart: currentWeekStart(), goals: [], tasks: [] }
}

function initPlan() {
  const stored = lsGet(KEY, null)
  if (!stored) return emptyPlan()
  if (stored.weekStart !== currentWeekStart()) {
    // New week — carry goals forward, reset tasks
    const fresh = emptyPlan()
    fresh.goals = stored.goals || []
    lsSet(KEY, fresh)
    return fresh
  }
  return stored
}

// Returns true if the given day-abbreviation is before today in the current week
// e.g. if today is Wed, Mon and Tue are "past"
function buildPastDays() {
  const todayIdx = WEEK_DAYS.indexOf(todayWeekDay())
  const past = new Set()
  for (let i = 0; i < todayIdx; i++) past.add(WEEK_DAYS[i])
  return past
}

export function useWeekPlan() {
  const [plan, setPlan] = useState(initPlan)

  const mutate = useCallback((fn) => {
    setPlan(prev => {
      const next = fn(prev)
      lsSet(KEY, next)    // persist every mutation
      return next
    })
  }, [])

  // Goals
  const addGoal    = (text)     => mutate(p => ({ ...p, goals: [...p.goals, { id: uid(), text, createdAt: new Date().toISOString() }] }))
  const updateGoal = (id, text) => mutate(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, text } : g) }))
  const deleteGoal = (id)       => mutate(p => ({ ...p, goals: p.goals.filter(g => g.id !== id) }))

  // Tasks
  const addTask    = (day, text, priority = 'medium') =>
    mutate(p => ({ ...p, tasks: [...p.tasks, { id: uid(), day, text, priority, status: 'todo', createdAt: new Date().toISOString() }] }))
  const updateTask = (id, changes) => mutate(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...changes } : t) }))
  const deleteTask = (id)          => mutate(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }))
  const toggleTask = (id)          => mutate(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t) }))

  const clearWeek  = () => { const f = emptyPlan(); lsSet(KEY, f); setPlan(f) }

  // Derived stats
  const total = plan.tasks.length
  const done  = plan.tasks.filter(t => t.status === 'done').length
  const pct   = total ? Math.round((done / total) * 100) : 0

  const dayBreakdown = useMemo(() => Object.fromEntries(
    WEEK_DAYS.map(d => {
      const dt = plan.tasks.filter(t => t.day === d)
      return [d, { done: dt.filter(t => t.status === 'done').length, total: dt.length }]
    })
  ), [plan.tasks])

  // Days that are locked: past days that HAVE tasks
  // (empty past days stay open so user can still fill them in retrospectively
  //  — but once a day has tasks it becomes read-only after the day passes)
  const pastDays   = buildPastDays()
  const lockedDays = useMemo(() => {
    const locked = new Set()
    for (const d of pastDays) {
      const hasTasks = plan.tasks.some(t => t.day === d)
      if (hasTasks) locked.add(d)
    }
    return locked
  }, [plan.tasks, plan.weekStart])

  return {
    plan,
    stats: { total, done, pct },
    dayBreakdown,
    lockedDays,
    pastDays,
    addGoal, updateGoal, deleteGoal,
    addTask, updateTask, deleteTask, toggleTask,
    clearWeek,
  }
}