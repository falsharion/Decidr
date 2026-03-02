export default function PageHeader({ num, title, sub }) {
  return (
    <div className="text-c mb-24">
      {num && <div className="eyebrow mb-12">{num}</div>}
      <h1 style={{ fontSize: 'clamp(36px, 7vw, 64px)', color: 'var(--cream)', marginBottom: 10 }}>
        {title}
      </h1>
      {sub && (
        <p style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 300, maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
          {sub}
        </p>
      )}
    </div>
  )
}