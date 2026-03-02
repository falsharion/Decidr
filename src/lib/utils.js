// ── IDs ────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// ── Week ───────────────────────────────────────────────────
export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LABELS = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}

export function currentWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff)
  return mon.toISOString().split('T')[0]
}

export function formatWeekRange(weekStart) {
  const mon = new Date(weekStart)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(mon)} – ${fmt(sun)} ${sun.getFullYear()}`
}

export function todayWeekDay() {
  const map = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' }
  return map[new Date().getDay()]
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Share ──────────────────────────────────────────────────
export function buildShareUrl(result, tool) {
  const payload = btoa(encodeURIComponent(JSON.stringify({ result, tool, ts: Date.now() })))
  return `${window.location.origin}/share?d=${payload}`
}

export function decodeSharePayload(encoded) {
  try { return JSON.parse(decodeURIComponent(atob(encoded))) }
  catch { return null }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = Object.assign(document.createElement('textarea'), {
      value: text, style: 'position:fixed;opacity:0',
    })
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  }
}

// ── localStorage ───────────────────────────────────────────
export function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch { /* quota */ }
}