// ── The Coin — AI PICKS the best option based on context ──

export function coinAIPickPrompt(options, context) {
  const optList = options.map((o, i) => `- "${o}"`).join('\n');
  
  return `
    SYSTEM: You are a decisive, logical advisor.
    USER CONTEXT: "${context}"
    AVAILABLE OPTIONS:
    ${optList}

    TASK:
    1. Select the SINGLE option that best aligns with the USER CONTEXT.
    2. If the user is tired/stressed, prioritize rest. If they are seeking growth, prioritize action.
    3. You MUST pick an option from the list above.

    RESPONSE FORMAT (STRICT):
    CHOICE: [exact text of the chosen option]
    REASON: [2 sentences max. Explain why this fits the context.]

    FINAL RULE: Do not use bolding (**), italics, or any text other than the format above.
  `.trim();
}

// Used after a random flip to give brief commentary
export function coinRandomCommentPrompt(options, chosen, context) {
  return `A user randomly chose "${chosen}" from: ${options.join(', ')}.${context ? ` Their context: "${context}".` : ''}
In 2 sentences max (under 50 words): give one reason this could work out well and one practical first step. Warm and direct. No markdown.`
}

export function prosConsPrompt(options) {
  const body = options
    .map(o => `"${o.label}"\n  Pros: ${o.pros.filter(Boolean).join(', ') || 'none listed'}\n  Cons: ${o.cons.filter(Boolean).join(', ') || 'none listed'}`)
    .join('\n\n')
  return `You are a clear-headed decision analyst. Here are the options:\n\n${body}\n\nIn 3–4 sentences (max 75 words): state which option appears strongest based on the balance shown, explain why in one sentence, then name one factor the user might be underweighting. Be honest, specific, and direct. No bullet points. No markdown.`
}

export function bracketPrompt(winner, all) {
  return `A user ran a tournament bracket. They compared: ${all.join(', ')}. Winner: "${winner}".
In exactly 2 sentences: what does it reveal about the user's priorities that "${winner}" beat all others in direct comparison? Be insightful and specific. No markdown.`
}

export function weeklyReviewPrompt(goals, tasks, done, total, pct, dayBreakdown) {
  const goalList = goals.length ? goals.map(g => `• ${g.text}`).join('\n') : '(no goals were set this week)'
  const dayLines = Object.entries(dayBreakdown)
    .map(([d, v]) => `  ${d}: ${v.done}/${v.total}`)
    .join('\n')
  const missed = tasks.filter(t => t.status === 'todo').map(t => `• ${t.text} [${t.day}, ${t.priority}]`).join('\n') || '(all tasks completed)'
  const highMissed = tasks.filter(t => t.status === 'todo' && t.priority === 'high').length

  return `You are a productivity coach giving a weekly performance review.

GOALS:
${goalList}

RESULT: ${done}/${total} tasks (${pct}%)${highMissed > 0 ? ` — ${highMissed} HIGH priority incomplete` : ''}

DAILY:
${dayLines}

INCOMPLETE:
${missed}

Write using EXACTLY these headers:

OVERVIEW
(2 honest sentences about the week)

WHAT WENT WELL
(1–2 sentences)

DO DIFFERENTLY NEXT WEEK
(2–3 specific, actionable suggestions tied to the missed tasks above)

Under 160 words. Plain text only — no bullet points, no bold, no markdown.`
}