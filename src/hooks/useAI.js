import { useState, useCallback } from 'react'
import { callGroq } from '../lib/groq'
import { lsGet, lsSet } from '../lib/utils'

const USAGE_KEY = 'decidr-ai-usage'
const DAILY_MAX = 30  // Groq is much more generous — bump to 30

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function readUsage() {
  const today  = getTodayKey()
  const stored = lsGet(USAGE_KEY, { date: today, count: 0 })
  if (stored.date !== today) return { date: today, count: 0 }
  return stored
}

function bumpUsage() {
  const current = readUsage()
  const next    = { ...current, count: current.count + 1 }
  lsSet(USAGE_KEY, next)
  return next
}

function parseError(raw) {
  const msg = raw?.message || String(raw)

  if (msg === 'NO_KEY') {
    return 'No API key set — add VITE_GROQ_API_KEY to your .env file.\nGet a free key at console.groq.com (no credit card needed).'
  }
  if (msg === 'BAD_KEY') {
    return 'Invalid API key — double-check VITE_GROQ_API_KEY in your .env file.'
  }
  if (msg === 'NETWORK') {
    return 'Network error — check your internet connection and try again.'
  }
  if (msg === 'EMPTY') {
    return 'AI returned an empty response — please try again.'
  }
  if (msg.startsWith('QUOTA:')) {
    return `You've used all ${DAILY_MAX} AI requests for today. Come back tomorrow — your limit resets at midnight!`
  }
  if (msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable')) {
    return 'AI service is temporarily busy. Please try again in a moment.'
  }

  // Fallback — never show raw API errors
  return 'AI is unavailable right now. Please try again in a moment.'
}

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [text, setText]       = useState(null)
  const [error, setError]     = useState(null)
  const [usage, setUsage]     = useState(readUsage)

  const remaining = Math.max(0, DAILY_MAX - usage.count)
  const exceeded  = usage.count >= DAILY_MAX

  const ask = useCallback(async (prompt) => {
    const current = readUsage()
    setUsage(current)

    if (current.count >= DAILY_MAX) {
      setError(`You've used all ${DAILY_MAX} AI requests for today. Come back tomorrow!`)
      return null
    }

    setLoading(true)
    setText(null)
    setError(null)

    try {
      const result = await callGroq(prompt)
      const next   = bumpUsage()
      setUsage(next)
      setText(result)
      return result
    } catch (e) {
      // Quota errors do NOT count against user's daily limit
      const friendly = parseError(e)
      setError(friendly)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false); setText(null); setError(null)
  }, [])

  return { loading, text, error, ask, reset, remaining, exceeded, dailyMax: DAILY_MAX }
}