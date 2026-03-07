'use client'

import { useEffect, useState } from 'react'
import AdminFrame from '../components/AdminFrame'
import { createSupabaseBrowserClient } from '../lib/supabase/client'

type ProfileRow = Record<string, unknown>

export default function ProfilesPage() {
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setError('Missing Supabase environment variables.')
        setLoading(false)
        return
      }
      const { data, error: loadError } = await supabase.from('profiles').select('*').limit(5000)
      if (loadError) {
        setError(loadError.message)
      } else {
        setRows((data ?? []) as ProfileRow[])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const filtered = rows.filter((row) => {
    const email = typeof row.email === 'string' ? row.email : ''
    const id = typeof row.id === 'string' ? row.id : ''
    const name = `${typeof row.first_name === 'string' ? row.first_name : ''} ${
      typeof row.last_name === 'string' ? row.last_name : ''
    }`.trim()
    const blob = `${email} ${id} ${name}`.toLowerCase()
    return blob.includes(query.toLowerCase())
  })

  return (
    <AdminFrame
      section="profiles"
      title="Profiles"
      subtitle="Read-only list of user profiles for moderation and access checks."
    >
      <input
        className="input search-input"
        placeholder="Search by email, id, or name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="notice error">{error}</p>}
      {loading ? (
        <p className="sub">Loading profiles…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Superadmin</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const id = typeof row.id === 'string' ? row.id : 'unknown'
                const email = typeof row.email === 'string' ? row.email : '—'
                const name = `${typeof row.first_name === 'string' ? row.first_name : ''} ${
                  typeof row.last_name === 'string' ? row.last_name : ''
                }`.trim()
                const isSuper = row.is_superadmin === true
                return (
                  <tr key={id}>
                    <td>{email}</td>
                    <td>{name || '—'}</td>
                    <td>{isSuper ? 'TRUE' : 'FALSE'}</td>
                    <td className="mono">{id}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminFrame>
  )
}
