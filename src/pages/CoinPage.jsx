import { useState, useRef, useEffect } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Toast from '../components/ui/Toast'
import { useAI } from '../hooks/useAI'
import { useHistory } from '../hooks/useHistory'
import { useToast } from '../hooks/useToast'
import { coinAIPickPrompt } from '../lib/prompts'
import { buildShareUrl, copyText, uid } from '../lib/utils'
import styles from './Coinpage.module.css'

function parseAIResponse(raw) {
  if (!raw) return { choice: null, reason: null }
  const choiceMatch = raw.match(/(?:CHOICE|Choice):\s*\**(.+?)\**(?:\n|$)/i)
  const reasonMatch = raw.match(/(?:REASON|Reason):\s*\**([\s\S]+)/i)
  let choice = choiceMatch?.[1]?.trim() ?? null
  let reason = reasonMatch?.[1]?.trim() ?? null
  if (reason) reason = reason.replace(/\*\*/g, '').trim()
  return { choice, reason }
}

function matchChoice(aiChoice, options) {
  if (!aiChoice) return options[0]
  const cleanAI = aiChoice.replace(/["'*/\-\d.]/g, '').toLowerCase().trim()
  const match = options.find(o => {
    const c = o.toLowerCase().trim()
    return c === cleanAI || c.includes(cleanAI) || cleanAI.includes(c)
  })
  return match || options[0]
}

// Animated number counter for AI remaining
function Counter({ value, max }) {
  const pct = (value / max) * 100
  const color = value <= 3 ? 'var(--red)' : value <= 8 ? 'var(--amber)' : 'var(--green)'
  return (
    <span className={styles.counterBadge} style={{ '--counter-color': color }} aria-label={`${value} of ${max} AI picks remaining today`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5"/>
        <circle cx="14" cy="14" r="11" fill="none" stroke={color}
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 11}`}
          strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct / 100)}`}
          transform="rotate(-90 14 14)"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      <span className={styles.counterNum} style={{ color }}>{value}</span>
    </span>
  )
}

export default function CoinPage() {
  const [options, setOptions]       = useState([{ id: uid(), val: '' }, { id: uid(), val: '' }])
  const [context, setContext]       = useState('')
  const [phase, setPhase]           = useState('input')
  const [result, setResult]         = useState(null)
  const [aiPick, setAiPick]         = useState(null)
  const [aiReason, setAiReason]     = useState(null)
  const [aiError, setAiError]       = useState(null)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [justAdded, setJustAdded]   = useState(null)
  const resultRef = useRef(null)

  const { ask, reset: resetAI, remaining, exceeded, dailyMax, error: aiHookError } = useAI()
  const { addEntry } = useHistory()
  const { toast, show } = useToast()

  const validOptions = options.filter(o => o.val.trim()).map(o => o.val.trim())
  const hasContext   = context.trim().length > 0
  const canFlip      = validOptions.length >= 2

  // Scroll to result when it appears
  useEffect(() => {
    if (phase === 'result' && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [phase])

  const addOption = () => {
    const newId = uid()
    setOptions(prev => [...prev, { id: newId, val: '' }])
    setJustAdded(newId)
    setTimeout(() => setJustAdded(null), 600)
  }

  const removeOption = (id) => {
    if (options.length > 2) setOptions(prev => prev.filter(o => o.id !== id))
  }

  const updateOption = (id, val) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, val } : o))
  }

  const flipCoin = async () => {
    if (!canFlip) return
    setPhase('flipping')
    setResult(null); setAiPick(null); setAiReason(null); setAiError(null)
    resetAI()

    await new Promise(r => setTimeout(r, 1800))
    const randomChoice = validOptions[Math.floor(Math.random() * validOptions.length)]

    setResult({ chosen: randomChoice })
    addEntry({ tool: 'coin', toolName: 'The Coin', result: randomChoice })
    setPhase('result')

    if (hasContext && !exceeded) {
      setIsAiThinking(true)
      const raw = await ask(coinAIPickPrompt(validOptions, context))
      if (raw) {
        const { choice, reason } = parseAIResponse(raw)
        setAiPick(matchChoice(choice, validOptions))
        setAiReason(reason || 'Based on your context, this is the strongest choice.')
      } else {
        setAiError(aiHookError || 'Could not get AI recommendation right now.')
      }
      setIsAiThinking(false)
    }
  }

  const resetForm = () => {
    setPhase('input'); setResult(null)
    setAiPick(null); setAiReason(null); setAiError(null)
    setOptions([{ id: uid(), val: '' }, { id: uid(), val: '' }])
    setContext(''); resetAI()
  }

  const shareResult = async () => {
    // Pass full rich payload — coin flip + AI pick + reason + context
    const sharePayload = {
      coinFlip: result?.chosen ?? '',
      ...(aiPick   ? { aiPick }   : {}),
      ...(aiReason ? { aiReason } : {}),
      ...(context.trim() ? { context: context.trim() } : {}),
    }
    await copyText(buildShareUrl(sharePayload, 'The Coin'))
    show('✓ Share link copied to clipboard')
  }

  return (
    <div className="page">
      <div className="c-sm">
        <PageHeader
          num="✦ Tool 01"
          title="The Coin"
          sub="Flip for a random decision, add context to get AI's thoughtful recommendation."
        />

        {/* ── INPUT ─────────────────────────────────────────── */}
        {phase === 'input' && (
          <div className={styles.inputPhase}>

            {/* AI limit banner */}
            {exceeded && (
              <div className={styles.limitBanner} role="status" aria-live="polite">
                <span className={styles.limitIcon} aria-hidden="true">🌙</span>
                <div>
                  <strong className={styles.limitTitle}>Daily AI limit reached</strong>
                  <p className={styles.limitText}>You can still flip — AI insights resume tomorrow at midnight.</p>
                </div>
              </div>
            )}

            {/* Options card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel} id="options-label">Your Options</span>
                <span className={styles.countPill} aria-label={`${validOptions.length} valid options`}>
                  {validOptions.length}<span className={styles.countSlash}>/</span>{options.length}
                </span>
              </div>

              <ol className={styles.optionList} aria-labelledby="options-label">
                {options.map((opt, i) => (
                  <li
                    key={opt.id}
                    className={`${styles.optionRow} ${justAdded === opt.id ? styles.optionRowNew : ''}`}
                  >
                    <span className={styles.optionNumber} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className={`${styles.inputWrap} ${focusedInput === opt.id ? styles.inputWrapFocused : ''} ${opt.val.trim() ? styles.inputWrapFilled : ''}`}>
                      <input
                        className={styles.optionInput}
                        value={opt.val}
                        onChange={e => updateOption(opt.id, e.target.value)}
                        onFocus={() => setFocusedInput(opt.id)}
                        onBlur={() => setFocusedInput(null)}
                        onKeyDown={e => e.key === 'Enter' && i === options.length - 1 && addOption()}
                        placeholder={i === 0 ? 'e.g. Go for a walk' : i === 1 ? 'e.g. Stay in and rest' : 'Another option...'}
                        aria-label={`Option ${i + 1}`}
                        maxLength={120}
                      />
                      {opt.val.trim() && (
                        <span className={styles.inputCheck} aria-hidden="true">✓</span>
                      )}
                    </div>
                    {options.length > 2 && (
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeOption(opt.id)}
                        aria-label={`Remove option ${i + 1}: ${opt.val || 'empty'}`}
                        tabIndex={0}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    )}
                  </li>
                ))}
              </ol>

              {options.length < 10 && (
                <button className={styles.addBtn} onClick={addOption} aria-label="Add another option">
                  <span className={styles.addBtnIcon} aria-hidden="true">+</span>
                  <span>Add another option</span>
                </button>
              )}
            </div>

            {/* Context card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel} id="context-label">
                  Your Situation
                  <span className={styles.optionalTag} aria-label="optional">optional</span>
                </span>
                {!exceeded && (
                  <span className={styles.aiCountRow} aria-label={`${remaining} of ${dailyMax} AI picks remaining`}>
                    <Counter value={remaining} max={dailyMax} />
                    <span className={styles.aiCountLabel}>AI picks left</span>
                  </span>
                )}
              </div>

              <div className={`${styles.textareaWrap} ${context.trim() ? styles.textareaWrapFilled : ''}`}>
                <textarea
                  className={styles.contextTextarea}
                  rows={3}
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  aria-labelledby="context-label"
                  placeholder="Tell the AI about your situation... e.g. I'm tired, have work tomorrow and need to recharge"
                  maxLength={500}
                />
                {context.trim() && (
                  <button
                    className={styles.clearContext}
                    onClick={() => setContext('')}
                    aria-label="Clear context"
                  >×</button>
                )}
              </div>

              <p className={styles.contextHint} aria-live="polite">
                {hasContext && !exceeded
                  ? '✦ AI will recommend the best option based on your situation'
                  : exceeded
                  ? '🌙 AI insights paused — resets at midnight'
                  : '✦ Add context to get a personalised AI recommendation'}
              </p>
            </div>

            {/* CTA */}
            <button
              className={`${styles.flipBtn} ${!canFlip ? styles.flipBtnDisabled : ''}`}
              onClick={flipCoin}
              disabled={!canFlip}
              aria-disabled={!canFlip}
              aria-describedby={!canFlip ? 'flip-hint' : undefined}
            >
              <span className={styles.flipBtnInner}>
                <span className={styles.flipBtnCoin} aria-hidden="true">🪙</span>
                <span className={styles.flipBtnText}>Flip the Coin</span>
                {hasContext && !exceeded && (
                  <span className={styles.flipBtnAiBadge} aria-label="with AI">+ AI</span>
                )}
              </span>
              <span className={styles.flipBtnSheen} aria-hidden="true" />
            </button>

            {!canFlip && (
              <p className={styles.flipHint} id="flip-hint" role="status">
                Add at least 2 options to continue
              </p>
            )}
          </div>
        )}

        {/* ── FLIPPING ──────────────────────────────────────── */}
        {phase === 'flipping' && (
          <div className={styles.flippingPhase} role="status" aria-live="polite" aria-label="Flipping coin animation">
            <div className={styles.coinOrbit} aria-hidden="true">
              <div className={styles.orbitRing} />
              <div className={styles.orbitRing2} />
              <div className={styles.coinEmoji}>🪙</div>
            </div>
            <h2 className={styles.flippingTitle}>Flipping the coin…</h2>
            <p className={styles.flippingText}>Choosing from {validOptions.length} options</p>
            {hasContext && !exceeded && (
              <div className={styles.aiQueuedBadge} aria-hidden="true">
                <span className={styles.aiQueuedDot} />
                <span>AI insight queued</span>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────────── */}
        {phase === 'result' && result && (
          <div className={styles.resultPhase} ref={resultRef}>

            {/* Coin result */}
            <div className={styles.resultCard} role="region" aria-label="Coin flip result">
              <div className={styles.resultTopAccent} aria-hidden="true" />
              <div className={styles.resultGlow}    aria-hidden="true" />

              <span className={styles.resultEyebrow}>
                <span aria-hidden="true">🪙</span> The Coin Lands On
              </span>
              <h2 className={styles.resultTitle}>{result.chosen}</h2>
              <p className={styles.resultSub}>
                Randomly selected from {validOptions.length} option{validOptions.length > 1 ? 's' : ''}
              </p>

              {/* Context echo */}
              {hasContext && (
                <div className={styles.contextEcho}>
                  <span className={styles.contextEchoLabel}>Your situation</span>
                  <p className={styles.contextEchoText}>"{context}"</p>
                </div>
              )}
            </div>

            {/* AI section — only if context given */}
            {hasContext && (
              <div className={styles.aiCard} role="region" aria-label="AI recommendation" aria-live="polite">
                <div className={styles.aiCardHeader}>
                  <span className={styles.aiStarIcon} aria-hidden="true">✦</span>
                  <span className={styles.aiCardTitle}>AI Recommendation</span>
                  {!isAiThinking && aiPick && (
                    <span className={styles.aiCardBadge} aria-label="Based on context">Given your context</span>
                  )}
                </div>

                {/* Loading */}
                {isAiThinking && (
                  <div className={styles.aiLoading} aria-label="AI is thinking">
                    <div className={styles.aiLoadingDots} aria-hidden="true">
                      <span /><span /><span />
                    </div>
                    <p className={styles.aiLoadingText}>Analysing your situation…</p>
                  </div>
                )}

                {/* AI pick result */}
                {!isAiThinking && aiPick && (
                  <div className={styles.aiResult}>
                    <div className={styles.aiPickBlock}>
                      <span className={styles.aiPickLabel}>AI would choose</span>
                      <p className={styles.aiPickText}>{aiPick}</p>
                      {aiPick !== result.chosen && (
                        <span className={styles.aiPickDiff} aria-label="Different from coin flip">
                          Different from the flip
                        </span>
                      )}
                      {aiPick === result.chosen && (
                        <span className={styles.aiPickMatch} aria-label="Agrees with coin flip">
                          ✓ Agrees with the flip
                        </span>
                      )}
                    </div>

                    {aiReason && (
                      <div className={styles.aiReasonBlock}>
                        <span className="badge badge-purple" style={{ marginBottom: 10, display: 'inline-flex' }}>✦ Why</span>
                        <p className={styles.aiReasonText}>{aiReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Limit reached */}
                {!isAiThinking && exceeded && (
                  <div className={styles.aiLimitNote} role="status">
                    <span aria-hidden="true">🌙</span>
                    <p>Daily AI limit reached — insights resume tomorrow.</p>
                  </div>
                )}

                {/* Error */}
                {!isAiThinking && !aiPick && !exceeded && aiError && (
                  <div className={styles.aiErrorNote} role="alert">
                    <span aria-hidden="true">⚠</span>
                    <p>{aiError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={styles.resultActions}>
              <button className={styles.shareBtn} onClick={shareResult} aria-label="Copy share link to clipboard">
                <span aria-hidden="true">⎘</span>
                <span>Share</span>
              </button>
              <button className={styles.flipAgainBtn} onClick={resetForm} aria-label="Start a new coin flip">
                <span aria-hidden="true">↺</span>
                <span>Flip Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <Toast message={toast} />
    </div>
  )
}