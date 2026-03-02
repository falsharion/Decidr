import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Toast from '../components/ui/Toast'
import { useHistory } from '../hooks/useHistory'
import { useToast } from '../hooks/useToast'
import { timeAgo, buildShareUrl, copyText } from '../lib/utils'
import styles from './Historypage.module.css'

const TOOL_ICONS = { Coin: '✦', 'pros-cons': '⚖', bracket: '🥊', planner: '📅' }

export default function HistoryPage() {
  const { history, removeEntry, clearHistory } = useHistory()
  const { toast, show } = useToast()

  const copyResult = async (entry) => {
    const url = buildShareUrl(entry.result, entry.toolName)
    await copyText(url)
    show('Share link copied!')
  }

  return (
    <div className="page">
      <div className="c-sm">
        <div className={`${styles.head} anim-up`}>
          <PageHeader num="⏱ Your Decisions" title="History" sub="Stored locally in your browser. Never leaves your device." />
          {history.length > 0 && (
            <button className="btn-outline" onClick={() => { if (window.confirm('Clear all history?')) clearHistory() }}>
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className={`card card-body ${styles.empty} anim-scale`}>
            <div className={styles.emptyIcon}>✦</div>
            <h2 className={styles.emptyTitle}>No decisions yet</h2>
            <p className="text-muted mb-16">Use any tool and your decisions will appear here.</p>
            <Link to="/coinpage" className="btn-outline">Try the Coin →</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {history.map((entry, i) => (
              <div key={entry.id} className={`card card-sm card-body ${styles.entry} anim-up`} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className={styles.entryIcon}>{TOOL_ICONS[entry.tool] ?? '✦'}</div>
                <div className={styles.entryBody}>
                  <div className={styles.entryTool}>{entry.toolName}</div>
                  <div className={styles.entryResult}>{entry.result}</div>
                </div>
                <div className={styles.entryMeta}>
                  <span className={`text-muted mono`} style={{ fontSize: 10 }}>{timeAgo(entry.createdAt)}</span>
                  <div className="flex gap-4">
                    <button className="btn-icon edit" onClick={() => copyResult(entry)} title="Copy share link">⎘</button>
                    <button className="btn-icon" onClick={() => removeEntry(entry.id)} title="Remove">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast message={toast} />
    </div>
  )
}