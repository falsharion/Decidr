import { useState, useEffect, useRef } from 'react'
import PageHeader from '../components/ui/PageHeader'
import AIBlock from '../components/ui/AIBlock'
import Toast from '../components/ui/Toast'
import { useAI } from '../hooks/useAI'
import { useHistory } from '../hooks/useHistory'
import { useToast } from '../hooks/useToast'
import { bracketPrompt } from '../lib/prompts'
import { uid, buildShareUrl, copyText } from '../lib/utils'
import styles from './Bracketpage.module.css'

// Animation states for each card slot
// idle | hovered | winner-surge | loser-flyLeft | loser-flyRight | entering-left | entering-right
function MatchArena({ pair, onPick, roundNum, totalRounds }) {
  const [leftAnim,  setLeftAnim]  = useState('idle')
  const [rightAnim, setRightAnim] = useState('idle')
  const [locked, setLocked]       = useState(false)
  const [shakeVs, setShakeVs]     = useState(false)
  // Flash overlay color when a pick fires
  const [flashSide, setFlashSide] = useState(null) // 'left' | 'right' | null

  // Reset anims when pair changes (new round)
  const prevPair = useRef(null)
  useEffect(() => {
    if (prevPair.current && prevPair.current !== pair) {
      // Don't reset — entering animations come from parent re-mount key
    }
    prevPair.current = pair
    setLeftAnim('idle'); setRightAnim('idle')
    setLocked(false); setFlashSide(null)
  }, [pair])

  const handlePick = async (side) => {
    if (locked) return
    setLocked(true)

    const winner = pair[side === 'left' ? 0 : 1]
    const loserSide = side === 'left' ? 'right' : 'left'

    // 1. Winner surges — loser flies away
    if (side === 'left') {
      setLeftAnim('winner-surge')
      setRightAnim('loser-flyRight')
      setFlashSide('left')
    } else {
      setRightAnim('winner-surge')
      setLeftAnim('loser-flyLeft')
      setFlashSide('right')
    }

    // Shake the VS badge
    setShakeVs(true)
    setTimeout(() => setShakeVs(false), 400)

    // Wait for exit animation, then notify parent
    await new Promise(r => setTimeout(r, 520))
    onPick(winner)
  }

  const progress = Math.round(((roundNum - 1) / totalRounds) * 100)

  return (
    <div className={styles.arenaWrap}>
      {/* Progress bar */}
      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>Round {roundNum} of {totalRounds}</span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <p className={styles.matchQ}>Which do you prefer?</p>

      <div className={styles.arena}>
        {/* Flash overlay */}
        {flashSide && (
          <div className={`${styles.flashOverlay} ${styles[`flash-${flashSide}`]}`} />
        )}

        {/* Left card */}
        <button
          className={`${styles.card} ${styles[leftAnim]}`}
          onMouseEnter={() => !locked && setLeftAnim('hovered')}
          onMouseLeave={() => !locked && setLeftAnim('idle')}
          onClick={() => handlePick('left')}
          disabled={locked}
          aria-label={`Choose ${pair[0]}`}
        >
          <div className={styles.cardInner}>
            <span className={styles.cardLabel}>Option A</span>
            <span className={styles.cardText}>{pair[0]}</span>
            <span className={styles.cardCTA}>Tap to choose →</span>
          </div>
          <div className={styles.cardGlow} />
          <div className={styles.cardRipple} />
        </button>

        {/* VS badge */}
        <div className={`${styles.vsBadge} ${shakeVs ? styles.vsShake : ''}`}>
          <span>VS</span>
        </div>

        {/* Right card */}
        <button
          className={`${styles.card} ${styles[rightAnim]}`}
          onMouseEnter={() => !locked && setRightAnim('hovered')}
          onMouseLeave={() => !locked && setRightAnim('idle')}
          onClick={() => handlePick('right')}
          disabled={locked}
          aria-label={`Choose ${pair[1]}`}
        >
          <div className={styles.cardInner}>
            <span className={styles.cardLabel}>Option B</span>
            <span className={styles.cardText}>{pair[1]}</span>
            <span className={styles.cardCTA}>← Tap to choose</span>
          </div>
          <div className={styles.cardGlow} />
          <div className={styles.cardRipple} />
        </button>
      </div>

      {/* Eliminated label fades in */}
      {flashSide && (
        <div className={styles.eliminatedRow}>
          <span className={styles.eliminatedTag}>eliminated</span>
        </div>
      )}
    </div>
  )
}

export default function BracketPage() {
  const [inputs, setInputs]       = useState([{ id: uid(), val: '' }, { id: uid(), val: '' }, { id: uid(), val: '' }, { id: uid(), val: '' }])
  const [phase, setPhase]         = useState('setup')
  const [pair, setPair]           = useState(null)
  const [queue, setQueue]         = useState([])
  const [roundWins, setRoundWins] = useState([])
  const [original, setOriginal]   = useState([])
  const [champion, setChampion]   = useState(null)
  const [roundNum, setRoundNum]   = useState(1)
  const [totalRounds, setTotalRounds] = useState(1)
  const [arenaKey, setArenaKey]   = useState(0) // force re-mount for entering anim

  const { loading, text, error, ask, remaining, exceeded, dailyMax } = useAI()
  const { addEntry } = useHistory()
  const { toast, show } = useToast()

  const valid = inputs.filter(o => o.val.trim()).map(o => o.val.trim())

  const start = () => {
    if (valid.length < 2) return
    const shuffled = [...valid].sort(() => Math.random() - 0.5)
    const total = shuffled.length - 1
    setOriginal(shuffled)
    setPair([shuffled[0], shuffled[1]])
    setQueue(shuffled.slice(2))
    setRoundWins([])
    setRoundNum(1)
    setTotalRounds(total)
    setArenaKey(k => k + 1)
    setPhase('voting')
  }

  const pick = (winner) => {
    const newWins = [...roundWins, winner]
    const newQ    = [...queue]
    const nextRound = roundNum + 1

    if (newQ.length >= 2) {
      setPair([newQ[0], newQ[1]]); setQueue(newQ.slice(2))
      setRoundWins(newWins); setRoundNum(nextRound)
      setArenaKey(k => k + 1)
    } else if (newQ.length === 1) {
      advance([...newWins, newQ[0]], nextRound)
    } else {
      newWins.length === 1 ? crown(newWins[0]) : advance(newWins, nextRound)
    }
  }

  const advance = (winners, nextRound) => {
    if (winners.length === 1) { crown(winners[0]); return }
    setPair([winners[0], winners[1]]); setQueue(winners.slice(2))
    setRoundWins([]); setRoundNum(nextRound)
    setArenaKey(k => k + 1)
  }

  const crown = async (champ) => {
    setChampion(champ); setPhase('winner')
    addEntry({ tool: 'bracket', toolName: 'The Bracket', result: champ })
    if (!exceeded) await ask(bracketPrompt(champ, original))
  }

  const reset = () => {
    setPhase('setup')
    setInputs([{ id: uid(), val: '' }, { id: uid(), val: '' }, { id: uid(), val: '' }, { id: uid(), val: '' }])
    setQueue([]); setRoundWins([]); setPair(null); setOriginal([]); setChampion(null)
    setRoundNum(1); setTotalRounds(1)
  }

  const share = async () => {
    await copyText(buildShareUrl(champion, 'The Bracket'))
    show('Share link copied!')
  }

  return (
    <div className="page">
      <div className="c-sm">
        <PageHeader num="✦ Tool 03" title="The Bracket" sub="Head-to-head eliminations until one option stands alone." />

        {/* ── SETUP ──────────────────────────────────────────── */}
        {phase === 'setup' && (
          <div className="anim-up">
            {exceeded && (
              <div className="limit-banner mb-12">
                <span className="limit-banner-icon">🌙</span>
                <p className="limit-banner-text">
                  <strong>Daily AI limit reached.</strong> Bracket still works — no AI insight on the winner today.
                </p>
              </div>
            )}
            <div className="card card-body mb-12">
              <div className="section-label">Contenders</div>
              <div className={styles.inputList}>
                {inputs.map((inp, i) => (
                  <div key={inp.id} className={`${styles.inputRow} anim-slide`} style={{ animationDelay: `${i * 0.04}s` }}>
                    <span className={styles.inputNum}>{String(i + 1).padStart(2, '0')}</span>
                    <input
                      className="input" value={inp.val}
                      onChange={e => setInputs(p => p.map(o => o.id === inp.id ? { ...o, val: e.target.value } : o))}
                      placeholder={`Contender ${i + 1}...`}
                      onKeyDown={e => { if (e.key === 'Enter' && i === inputs.length - 1) setInputs(p => [...p, { id: uid(), val: '' }]) }}
                    />
                    {inputs.length > 2 && (
                      <button className="btn-icon" onClick={() => setInputs(p => p.filter(o => o.id !== inp.id))}>×</button>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn-ghost-add mt-10" onClick={() => setInputs(p => [...p, { id: uid(), val: '' }])}>
                + Add Contender
              </button>
            </div>
            <button className="btn-gold" onClick={start} disabled={valid.length < 2}>
               Start the Bracket
            </button>
          </div>
        )}

        {/* ── VOTING ─────────────────────────────────────────── */}
        {phase === 'voting' && pair && (
          <MatchArena
            key={arenaKey}
            pair={pair}
            onPick={pick}
            roundNum={roundNum}
            totalRounds={totalRounds}
          />
        )}

        {/* ── WINNER ─────────────────────────────────────────── */}
        {phase === 'winner' && champion && (
          <div className="anim-scale">
            <div className={styles.championBanner}>
              {/* Spotlight layers */}
              <div className={styles.spotlightCone}  aria-hidden="true" />
              <div className={styles.spotlightLeft}  aria-hidden="true" />
              <div className={styles.spotlightRight} aria-hidden="true" />
              <div className={styles.spotlightHalo}  aria-hidden="true" />
              <div className={styles.spotlightFloor} aria-hidden="true" />
              <div className={styles.championConfetti} aria-hidden="true">
                {[...Array(12)].map((_, i) => (
                  <span key={i} className={styles.confettiDot} style={{ '--i': i }} />
                ))}
              </div>
              <span className={styles.championTrophy}>🏆</span>
              <span className={styles.championEyebrow}>Champion</span>
              <h2 className={styles.championTitle}>{champion}</h2>
              <p className={styles.championSub}>
                Beat {original.length - 1} other option{original.length > 2 ? 's' : ''}
              </p>
            </div>

            <div className="result-card mt-12">
              <div className="result-glow" />
              {exceeded ? (
                <div className="limit-banner">
                  <span className="limit-banner-icon">🌙</span>
                  <p className="limit-banner-text">
                    <strong>No AI insight today</strong> — all {dailyMax} requests used. Come back tomorrow!
                  </p>
                </div>
              ) : (
                <AIBlock loading={loading} text={text} error={error} remaining={remaining} dailyMax={dailyMax} />
              )}
            </div>

            <div className={`${styles.winActions} mt-12`}>
              <button className="btn-outline" onClick={share}>⎘ Share</button>
              <button className="btn-outline" style={{ flex: 1 }} onClick={reset}>↺ New Bracket</button>
            </div>
          </div>
        )}
      </div>
      <Toast message={toast} />
    </div>
  )
}