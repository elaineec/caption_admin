'use client'

import { useEffect, useState } from 'react'
import AdminFrame from './components/AdminFrame'
import { createSupabaseBrowserClient } from './lib/supabase/client'

type MetricState = {
  profiles: number
  captions: number
  images: number
  publicCaptions: number
}

type Uploader = { id: string; count: number; label: string }

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricState>({
    profiles: 0,
    captions: 0,
    images: 0,
    publicCaptions: 0,
  })
  const [topUploaders, setTopUploaders] = useState<Uploader[]>([])
  const [recentImages, setRecentImages] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    async function loadDashboard() {
      if (!supabase) {
        setError('Missing Supabase environment variables.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const [profilesCount, captionsCount, imagesCount, publicCount, captionsRows, profilesRows, imagesRows] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('captions').select('id', { count: 'exact', head: true }),
          supabase.from('images').select('id', { count: 'exact', head: true }),
          supabase.from('captions').select('id', { count: 'exact', head: true }).eq('is_public', true),
          supabase.from('captions').select('id, profile_id').limit(5000),
          supabase.from('profiles').select('*').limit(5000),
          supabase.from('images').select('*').limit(8),
        ])

      const firstError =
        profilesCount.error ||
        captionsCount.error ||
        imagesCount.error ||
        publicCount.error ||
        captionsRows.error ||
        profilesRows.error ||
        imagesRows.error

      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      setMetrics({
        profiles: profilesCount.count ?? 0,
        captions: captionsCount.count ?? 0,
        images: imagesCount.count ?? 0,
        publicCaptions: publicCount.count ?? 0,
      })

      const byUploader = new Map<string, number>()
      for (const row of (captionsRows.data ?? []) as Array<Record<string, unknown>>) {
        const profileId = typeof row.profile_id === 'string' ? row.profile_id : null
        if (!profileId) continue
        byUploader.set(profileId, (byUploader.get(profileId) ?? 0) + 1)
      }

      const profileMap = new Map<string, Record<string, unknown>>()
      for (const row of (profilesRows.data ?? []) as Array<Record<string, unknown>>) {
        const id = typeof row.id === 'string' ? row.id : null
        if (id) profileMap.set(id, row)
      }

      const top = [...byUploader.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({
          id,
          count,
          label: profileLabel(profileMap.get(id), id),
        }))

      setTopUploaders(top)
      setRecentImages((imagesRows.data ?? []) as Record<string, unknown>[])
      setLoading(false)
    }

    loadDashboard()
  }, [supabase])

  const publicShare = metrics.captions
    ? Math.round((metrics.publicCaptions / metrics.captions) * 100)
    : 0

  return (
    <AdminFrame
      section="dashboard"
      title="Admin Dashboard"
      subtitle="Quick pulse of staging data and high-signal trends."
    >
      {error && <p className="notice error">{error}</p>}
      {loading ? (
        <p className="sub">Loading dashboard…</p>
      ) : (
        <>
          <section className="stat-grid">
            <article className="stat-card">
              <p className="eyebrow">Profiles</p>
              <strong>{metrics.profiles.toLocaleString()}</strong>
              <small>Total user profiles</small>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Captions</p>
              <strong>{metrics.captions.toLocaleString()}</strong>
              <small>Total captions in dataset</small>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Images</p>
              <strong>{metrics.images.toLocaleString()}</strong>
              <small>Total image rows</small>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Public Share</p>
              <strong>{publicShare}%</strong>
              <small>Captions marked public</small>
            </article>
          </section>

          <section className="panel-grid">
            <article className="panel">
              <h2>Top uploaders</h2>
              {topUploaders.length ? (
                <ul className="data-list">
                  {topUploaders.map((uploader) => (
                    <li key={uploader.id}>
                      <span>{uploader.label}</span>
                      <strong>{uploader.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sub">No caption uploader data found.</p>
              )}
            </article>

            <article className="panel">
              <h2>Recent image rows</h2>
              {recentImages.length ? (
                <div className="thumb-grid">
                  {recentImages.map((image, index) => {
                    const id = typeof image.id === 'string' ? image.id : `image-${index}`
                    const url = typeof image.url === 'string' ? image.url : null
                    const label =
                      typeof image.image_description === 'string'
                        ? image.image_description
                        : 'No description'
                    return (
                      <article key={id} className="thumb-card">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={label} />
                        ) : (
                          <div className="thumb-placeholder">No URL</div>
                        )}
                        <p>{label}</p>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className="sub">No recent images available.</p>
              )}
            </article>
          </section>
        </>
      )}
    </AdminFrame>
  )
}

function profileLabel(profile: Record<string, unknown> | undefined, fallbackId: string) {
  if (!profile) return fallbackId.slice(0, 8)
  const firstName = typeof profile.first_name === 'string' ? profile.first_name : ''
  const lastName = typeof profile.last_name === 'string' ? profile.last_name : ''
  const email = typeof profile.email === 'string' ? profile.email : ''
  const name = `${firstName} ${lastName}`.trim()
  if (name) return name
  if (email) return email
  return fallbackId.slice(0, 8)
}
