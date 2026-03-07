'use client'

import { useEffect, useState } from 'react'
import AdminFrame from '../components/AdminFrame'
import { createSupabaseBrowserClient } from '../lib/supabase/client'

type CaptionRow = Record<string, unknown>

export default function CaptionsPage() {
  const [rows, setRows] = useState<CaptionRow[]>([])
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
      const { data, error: loadError } = await supabase.from('captions').select('*').limit(2000)
      if (loadError) {
        setError(loadError.message)
      } else {
        setRows((data ?? []) as CaptionRow[])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const filtered = rows.filter((row) => {
    const content = typeof row.content === 'string' ? row.content : ''
    const profileId = typeof row.profile_id === 'string' ? row.profile_id : ''
    const imageId = typeof row.image_id === 'string' ? row.image_id : ''
    const blob = `${content} ${profileId} ${imageId}`.toLowerCase()
    return blob.includes(query.toLowerCase())
  })

  return (
    <AdminFrame
      section="captions"
      title="Captions"
      subtitle="Read-only table of caption rows with linked profile/image references."
    >
      <input
        className="input search-input"
        placeholder="Search caption text, profile_id, or image_id"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="notice error">{error}</p>}
      {loading ? (
        <p className="sub">Loading captions…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Caption</th>
                <th>Public</th>
                <th>Profile</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => {
                const id = typeof row.id === 'string' ? row.id : `caption-${index}`
                return (
                  <tr key={id}>
                    <td>{typeof row.content === 'string' ? row.content : '—'}</td>
                    <td>{row.is_public === true ? 'TRUE' : 'FALSE'}</td>
                    <td className="mono">{typeof row.profile_id === 'string' ? row.profile_id : '—'}</td>
                    <td className="mono">{typeof row.image_id === 'string' ? row.image_id : '—'}</td>
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
