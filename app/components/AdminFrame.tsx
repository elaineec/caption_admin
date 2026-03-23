import Link from 'next/link'
import AuthControls from './AuthControls'
import { ADMIN_RESOURCES } from '../lib/admin-resources'
import ThemeToggle from './ThemeToggle'

type Section = 'dashboard' | 'profiles' | 'images' | 'captions' | 'resources' | 'prompt-lab'

const CONTENT_SLUGS = ['images', 'captions', 'caption-requests', 'caption-examples', 'terms'] as const
const HUMOR_SLUGS = ['humor-flavors', 'humor-flavor-steps', 'humor-mix'] as const
const AI_SLUGS = ['llm-models', 'llm-providers', 'llm-prompt-chains', 'llm-responses'] as const
const ACCESS_SLUGS = ['allowed-signup-domains', 'whitelisted-emails'] as const

function bySlugs(slugs: readonly string[]) {
  return ADMIN_RESOURCES.filter((resource) => slugs.includes(resource.slug))
}

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
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">AlmostCrack&apos;d</p>
          <h2>Admin Panel</h2>
        </div>
        <div className="admin-auth">
          <AuthControls />
        </div>

        <nav className="sidebar-links" aria-label="Admin routes">
          <p className="sidebar-label">Overview</p>
          <Link className={`sidebar-link ${section === 'dashboard' ? 'active' : ''}`} href="/">
            Dashboard
          </Link>
          <Link className={`sidebar-link ${section === 'profiles' ? 'active' : ''}`} href="/profiles">
            Profiles
          </Link>

          <p className="sidebar-label">Content</p>
          <Link className={`sidebar-link ${section === 'images' ? 'active' : ''}`} href="/images">
            Images
          </Link>
          <Link className={`sidebar-link ${section === 'captions' ? 'active' : ''}`} href="/captions">
            Captions
          </Link>
          {bySlugs(CONTENT_SLUGS).map((resource) => (
            <Link className="sidebar-link secondary" href={`/resources/${resource.slug}`} key={resource.slug}>
              {resource.title}
            </Link>
          ))}

          <p className="sidebar-label">Humor</p>
          {bySlugs(HUMOR_SLUGS).map((resource) => (
            <Link className="sidebar-link secondary" href={`/resources/${resource.slug}`} key={resource.slug}>
              {resource.title}
            </Link>
          ))}

          <p className="sidebar-label">AI / LLM</p>
          {bySlugs(AI_SLUGS).map((resource) => (
            <Link className="sidebar-link secondary" href={`/resources/${resource.slug}`} key={resource.slug}>
              {resource.title}
            </Link>
          ))}
          <Link className={`sidebar-link ${section === 'prompt-lab' ? 'active' : ''}`} href="/prompt-lab">
            Prompt Lab
          </Link>

          <p className="sidebar-label">Access</p>
          {bySlugs(ACCESS_SLUGS).map((resource) => (
            <Link className="sidebar-link secondary" href={`/resources/${resource.slug}`} key={resource.slug}>
              {resource.title}
            </Link>
          ))}

          <Link className={`sidebar-link ${section === 'resources' ? 'active' : ''}`} href="/resources">
            Resources
          </Link>
        </nav>
      </aside>

      <section className="admin-page">
        <header className="admin-nav">
          <div className="admin-brand">
            <p className="eyebrow">Staging Admin</p>
            <h1>{title}</h1>
            <p className="sub">{subtitle}</p>
          </div>
          <ThemeToggle />
        </header>

        <section className="start-here-strip" aria-label="Start here onboarding">
          <div className="start-here-copy">
            <p className="eyebrow">Start here</p>
            <h2>Three steps to get useful work done quickly</h2>
            <p className="sub">Pick a section, make one focused change, then confirm the success state before moving on.</p>
          </div>
          <div className="start-here-steps">
            <article className="start-step">
              <span className="start-step-index">1</span>
              <div>
                <strong>Choose a lane</strong>
                <p>Use the sidebar to jump to the exact dataset or admin tool you need.</p>
              </div>
            </article>
            <article className="start-step">
              <span className="start-step-index">2</span>
              <div>
                <strong>Filter before editing</strong>
                <p>Search first so edits stay targeted and safer to review.</p>
              </div>
            </article>
            <article className="start-step">
              <span className="start-step-index">3</span>
              <div>
                <strong>Verify the confirmation</strong>
                <p>Look for the success banner after a save, upload, delete, or reorder action.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="admin-content">{children}</section>
      </section>
    </main>
  )
}
