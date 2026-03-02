import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import AIBlock from '../components/ui/AIBlock'
import Toast from '../components/ui/Toast'
import { useAI } from '../hooks/useAI'
import { useHistory } from '../hooks/useHistory'
import { useToast } from '../hooks/useToast'
import { prosConsPrompt } from '../lib/prompts'
import { uid, buildShareUrl, copyText } from '../lib/utils'
import styles from './Prosconspage.module.css'

function makeOption(label = '') {
  return { id: uid(), label, pros: [''], cons: [''] }
}

export default function ProsConsPage() {
  const [options, setOptions] = useState([makeOption(), makeOption()])
  const [analysed, setAnalysed] = useState(false)
  const { loading, text, error, ask, reset: resetAI, remaining, exceeded, dailyMax } = useAI()
  const { addEntry } = useHistory()
  const { toast, show } = useToast()

  const setLabel = (id, label) => setOptions(p => p.map(o => o.id === id ? { ...o, label } : o))
  const setItem  = (id, side, i, val) => setOptions(p => p.map(o => { if (o.id !== id) return o; const a = [...o[side]]; a[i] = val; return { ...o, [side]: a } }))
  const addItem  = (id, side) => setOptions(p => p.map(o => o.id === id ? { ...o, [side]: [...o[side], ''] } : o))
  const remItem  = (id, side, i) => setOptions(p => p.map(o => { if (o.id !== id) return o; const a = o[side].filter((_, x) => x !== i); return { ...o, [side]: a.length ? a : [''] } }))
  const addOpt   = () => setOptions(p => [...p, makeOption()])
  const remOpt   = (id) => { if (options.length > 2) setOptions(p => p.filter(o => o.id !== id)) }

  const valid = options.filter(o => o.label.trim())

  const analyse = async () => {
    if (valid.length < 2) return
    if (exceeded) { show(`Daily AI limit reached (${dailyMax}/day). Come back tomorrow!`); return }
    setAnalysed(true)
    resetAI()
    addEntry({ tool: 'pros-cons', toolName: 'Pros & Cons', result: valid.map(o => o.label).join(' vs ') })
    await ask(prosConsPrompt(valid))
  }

  const reset = () => { setOptions([makeOption(), makeOption()]); setAnalysed(false); resetAI() }

  const share = async () => {
    if (!text) return
    await copyText(buildShareUrl(text, 'Pros & Cons'))
    show('Share link copied!')
  }

  return (
    <div className="page">
      <div className="c-md">
        <PageHeader num="✦ Tool 02" title="Pros & Cons" sub="Map out the upsides and downsides. AI delivers a clear verdict." />

        {exceeded && !analysed && (
          <div className="limit-banner mb-12">
            <span className="limit-banner-icon">🌙</span>
            <p className="limit-banner-text"><strong>Daily AI limit reached.</strong> You've used all {dailyMax} requests today. You can still use the tool — just no AI analysis until tomorrow.</p>
          </div>
        )}

        <div className={styles.grid}>
          {options.map((opt, oi) => (
            <div key={opt.id} className={`card card-body ${styles.optCard} anim-up`} style={{ animationDelay: `${oi * 0.06}s` }}>
              <div className={styles.optHead}>
                <input className={`input ${styles.labelInput}`} value={opt.label} onChange={e => setLabel(opt.id, e.target.value)} placeholder={`Option ${oi + 1}...`} />
                {options.length > 2 && <button className="btn-icon" onClick={() => remOpt(opt.id)}>×</button>}
              </div>
              <div className={styles.sides}>
                {['pros', 'cons'].map(side => (
                  <div key={side} className={styles.sideCol}>
                    <div className={`${styles.sideLabel} ${styles[side]}`}>{side === 'pros' ? '✓ Pros' : '✗ Cons'}</div>
                    {opt[side].map((item, i) => (
                      <div key={i} className={styles.itemRow}>
                        <input className={`input ${styles.itemInput}`} value={item}
                          onChange={e => setItem(opt.id, side, i, e.target.value)}
                          placeholder={side === 'pros' ? 'An upside...' : 'A downside...'}
                          onKeyDown={e => e.key === 'Enter' && addItem(opt.id, side)} />
                        {opt[side].length > 1 && (
                          <button className="btn-icon" style={{ width: 28, height: 28, fontSize: 13 }} onClick={() => remItem(opt.id, side, i)}>×</button>
                        )}
                      </div>
                    ))}
                    <button className={styles.addItemBtn} onClick={() => addItem(opt.id, side)}>+ Add</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`${styles.actions} mt-12 mb-12`}>
          <button className="btn-ghost-add" style={{ flex: '0 0 140px' }} onClick={addOpt}>+ Add Option</button>
          <button className="btn-gold" style={{ flex: 1, fontSize: 16 }} onClick={analyse} disabled={valid.length < 2 || exceeded}>
            {exceeded ? `AI Limit Reached (${dailyMax}/day)` : '⚖ Analyse with AI'}
          </button>
        </div>

        {analysed && (
          <div className="result-card anim-scale">
            <div className="result-glow" />
            <div className="result-eyebrow">AI Verdict</div>
            <AIBlock loading={loading} text={text} error={error} label="✦ Gemini Analysis" remaining={remaining} dailyMax={dailyMax} />
            {!loading && (text || error) && (
              <div className={`${styles.actions} mt-16`} style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {text && <button className="btn-outline" onClick={share}>⎘ Share</button>}
                <button className="btn-outline" style={{ flex: 1 }} onClick={reset}>↺ Start Over</button>
              </div>
            )}
          </div>
        )}
      </div>
      <Toast message={toast} />
    </div>
  )
}