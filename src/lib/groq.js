// Groq API — free tier, no credit card, 14,400 req/day
// Get your free key at: https://console.groq.com
// Uses llama-3.3-70b-versatile (smart) with fallback to llama-3.1-8b-instant (fast)

const BASE = '/api/groq' 

const MODELS = [
  'llama-3.3-70b-versatile',   // Primary: best quality
  'llama-3.1-8b-instant',      // Fallback: faster, lower quota usage
  'gemma2-9b-it',              // Last resort
]

function isQuotaError(status, msg) {
  return (
    status === 429 ||
    msg.includes('rate_limit') ||
    msg.includes('Rate limit') ||
    msg.includes('quota') ||
    msg.includes('too_many_requests')
  )
}

export async function callGroq(prompt) {

  let lastError = null

  for (const model of MODELS) {
    let res
    try {
      res = await fetch(BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.78,
        }),
      })
    } catch {
      throw new Error('NETWORK')
    }

    if (!res.ok) {
      let body = {}
      try { body = await res.json() } catch { /* ignore */ }
      const msg = body?.error?.message || body?.error?.code || `status ${res.status}`

      if (isQuotaError(res.status, msg)) {
        lastError = new Error(`QUOTA:${msg}`)
        continue // try next model
      }

      // Auth error
      if (res.status === 401) throw new Error('BAD_KEY')

      throw new Error(msg)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('EMPTY')
    return text.trim()
  }

  throw lastError || new Error('QUOTA:all models exhausted')
}