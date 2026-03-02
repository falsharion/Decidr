import { useState, useCallback } from 'react'
import { uid, lsGet, lsSet } from '../lib/utils'

const KEY = 'decidr-history'
const MAX = 50

export function useHistory() {
  const [history, setHistory] = useState(() => lsGet(KEY, []))

  const addEntry = useCallback(({ tool, toolName, result }) => {
    const entry = { id: uid(), tool, toolName, result, createdAt: new Date().toISOString() }
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, MAX)
      lsSet(KEY, next)
      return next
    })
  }, [])

  const removeEntry = useCallback((id) => {
    setHistory(prev => {
      const next = prev.filter(e => e.id !== id)
      lsSet(KEY, next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    lsSet(KEY, [])
    setHistory([])
  }, [])

  return { history, addEntry, removeEntry, clearHistory }
}