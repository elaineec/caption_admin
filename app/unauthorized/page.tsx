import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Unauthorized</p>
        <h1>Superadmin required</h1>
        <p className="sub">
          Your account is signed in but does not have admin permissions yet.
        </p>
        <Link className="btn" href="/login">
          Back to Login
        </Link>
      </section>
    </main>
  )
}
