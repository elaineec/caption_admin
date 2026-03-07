import Link from 'next/link'
import AuthControls from './AuthControls'

type Section = 'dashboard' | 'profiles' | 'images' | 'captions' | 'resources'

export default function AdminFrame({
  section,
  title,
  subtitle,
  children,
}: {
  section: Section
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="admin-page">
      <header className="admin-nav">
        <div className="admin-brand">
          <p className="eyebrow">Staging Admin</p>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
        </div>
        <nav className="admin-links" aria-label="Admin routes">
          <Link className={`nav-pill ${section === 'dashboard' ? 'active' : ''}`} href="/">
            Dashboard
          </Link>
          <Link className={`nav-pill ${section === 'profiles' ? 'active' : ''}`} href="/profiles">
            Profiles
          </Link>
          <Link className={`nav-pill ${section === 'images' ? 'active' : ''}`} href="/images">
            Images
          </Link>
          <Link className={`nav-pill ${section === 'captions' ? 'active' : ''}`} href="/captions">
            Captions
          </Link>
          <Link className={`nav-pill ${section === 'resources' ? 'active' : ''}`} href="/resources">
            Resources
          </Link>
        </nav>
        <div className="admin-auth">
          <AuthControls />
        </div>
      </header>

      <section className="admin-content">{children}</section>
    </main>
  )
}
