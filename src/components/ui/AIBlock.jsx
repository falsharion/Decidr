export default function AIBlock({ loading, text, error, label = '✦ AI Insight', remaining, dailyMax }) {
  const showCounter = typeof remaining === 'number'

  return (
    <div className="ai-block">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="badge badge-purple">{label}</span>
        {showCounter && !loading && !text && !error && (
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: remaining <= 3 ? 'var(--amber)' : 'var(--muted)',
            letterSpacing: '0.06em',
          }}>
            {remaining}/{dailyMax} left today
          </span>
        )}
      </div>

      {loading && (
        <div className="ai-loading">
          <div className="dots">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </div>
          <span>Thinking...</span>
        </div>
      )}

      {error && !loading && (
        <div className="ai-error-box">
          <span className="ai-error-icon">⚠</span>
          <p className="ai-error-msg">{error}</p>
        </div>
      )}

      {text && !loading && (
        <p className="ai-text">{text}</p>
      )}
    </div>
  )
}