import { redirect } from 'next/navigation'
import LoginButton from '../components/LoginButton'
import { createSupabaseServerClient } from '../lib/supabase/server'

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient()
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect('/')
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Admin Access</p>
        <h1>Caption Database Admin</h1>
        <p className="sub">
          Sign in with Google. Only profiles with <code>is_superadmin=true</code> can enter.
        </p>
        <LoginButton />
      </section>
    </main>
  )
}
