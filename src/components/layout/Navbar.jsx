import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import './Navbar.css'

const LINKS = [
  { to: '/coin',      label: 'The Coin',    icon: '🪙' },
  { to: '/pros-cons', label: 'Pros & Cons', icon: '⚖' },
  { to: '/bracket',  label: 'Bracket',     icon: '🥊' },
  { to: '/planner',  label: 'Planner',     icon: '📅' },
{ to: '/clarity', label: 'Clarity', icon: '◈' },
  { to: '/history',  label: 'History',     icon: '⏱' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <nav className="navbar">
        <div className="c navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="navbar-star">✦</span>
            <span className="navbar-brand">Decidr</span>
          </Link>

          <div className="nav-links navbar-links">
            {LINKS.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          <button
            className="nav-burger navbar-burger"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`burger-bar${open ? ' open-1' : ''}`} />
            <span className={`burger-bar${open ? ' open-2' : ''}`} />
            <span className={`burger-bar${open ? ' open-3' : ''}`} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-head">
              <span className="navbar-brand" style={{ fontSize: 22 }}>✦ Decidr</span>
              <button className="drawer-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            {LINKS.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `drawer-link${isActive ? ' active' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="drawer-icon">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  )
}