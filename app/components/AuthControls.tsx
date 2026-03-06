'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'

type UserInfo = {
  email?: string | null
  name?: string | null
}

export default function AuthControls() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      setUser(
        data.user
          ? { email: data.user.email, name: data.user.user_metadata?.full_name ?? null }
          : null
      )
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? { email: session.user.email, name: session.user.user_metadata?.full_name ?? null }
          : null
      )
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function signIn() {
    if (!supabase) return
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
  }

  async function signOut() {
    if (!supabase) return
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    setOpen(false)
    window.location.replace('/login')
  }

  if (!supabase) return <span className="status">Missing env vars</span>

  if (!user) {
    return (
      <button className="btn" onClick={signIn} disabled={loading}>
        Continue with Google
      </button>
    )
  }

  return (
    <div className="auth">
      <div className={`account ${open ? 'open' : ''}`}>
        <button
          className="account-button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          disabled={loading}
        >
          <div className="account-label">Account</div>
          <div className="account-name">{user.name ?? user.email ?? 'Signed in'}</div>
          <span className="account-caret">▾</span>
        </button>
        {open && (
          <div className="account-menu">
            <button className="btn" onClick={signOut} disabled={loading}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
