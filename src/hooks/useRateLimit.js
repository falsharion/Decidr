import { useState, useCallback } from 'react'
import { lsGet, lsSet } from '../lib/utils'

const KEY       = 'decidr-ai-usage'
const DAILY_MAX = 10

function getTodayKey() {
  return new Date().toISOString().split('T')[0] // "2026-02-24"
}

function getUsage() {
  const today = getTodayKey()
  const stored = lsGet(KEY, { date: today, count: 0 })
  // Reset if it's a new day
  if (stored.date !== today) return { date: today, count: 0 }
  return stored
}

export function useRateLimit() {
  const [usage, setUsage] = useState(getUsage)

  const remaining = Math.max(0, DAILY_MAX - usage.count)
  const exceeded  = usage.count >= DAILY_MAX

  const consume = useCallback(() => {
    const current = getUsage()
    if (current.count >= DAILY_MAX) return false
    const next = { ...current, count: current.count + 1 }
    lsSet(KEY, next)
    setUsage(next)
    return true
  }, [])

  // Sync state in case another tab changed it
  const refresh = useCallback(() => setUsage(getUsage()), [])

  return { remaining, exceeded, consume, refresh, dailyMax: DAILY_MAX }
}