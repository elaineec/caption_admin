import UnauthorizedActions from './unauthorized-actions'

export default function UnauthorizedPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Unauthorized</p>
        <h1>Superadmin required</h1>
        <p className="sub">
          Your account is signed in but does not have admin permissions yet.
        </p>
        <UnauthorizedActions />
      </section>
    </main>
  )
}
