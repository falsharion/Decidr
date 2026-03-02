import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="page text-c">
      <div className="c-sm">
        <p className="eyebrow mb-12">404</p>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(36px,7vw,64px)', color: 'var(--cream)', marginBottom: 14 }}>
          The Coin is lost.
        </h1>
        <p className="text-muted mb-24" style={{ maxWidth: 340, margin: '0 auto 24px' }}>
          This page doesn't exist but a decision awaits you.
        </p>
        <Link to="/" className="btn-outline">← Go Home</Link>
      </div>
    </div>
  )
}