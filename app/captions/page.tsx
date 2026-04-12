'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminFrame from '../components/AdminFrame'
import { createSupabaseBrowserClient } from '../lib/supabase/client'

type CaptionRow = Record<string, unknown>
type RatingAggregate = {
  count: number
  average: number | null
  latestAt: string | null
}
type FlavorRatingSummary = {
  flavorLabel: string
  captionCount: number
  ratedCaptionCount: number
  ratingCount: number
  averageScore: number | null
}

const CAPTION_RATING_TABLE_CANDIDATES = [
  'caption_ratings',
  'caption_rating_votes',
  'caption_votes',
  'caption_feedback',
  'caption_reviews',
] as const

export default function CaptionsPage() {
  const [rows, setRows] = useState<CaptionRow[]>([])
  const [ratingStatsByCaptionId, setRatingStatsByCaptionId] = useState<Record<string, RatingAggregate>>({})
  const [ratingTableName, setRatingTableName] = useState<string | null>(null)
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
        setLoading(false)
        return
      }

      setRows((data ?? []) as CaptionRow[])

      let resolvedRatingTable: string | null = null
      let resolvedRatings: CaptionRow[] = []
      for (const tableName of CAPTION_RATING_TABLE_CANDIDATES) {
        const { data: ratingsData, error: ratingsError } = await supabase.from(tableName).select('*').limit(5000)
        if (ratingsError) continue
        resolvedRatingTable = tableName
        resolvedRatings = (ratingsData ?? []) as CaptionRow[]
        break
      }

      setRatingTableName(resolvedRatingTable)
      setRatingStatsByCaptionId(buildRatingAggregates(resolvedRatings))
      setLoading(false)
    }
    load()
  }, [supabase])

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const content = typeof row.content === 'string' ? row.content : ''
        const profileId = typeof row.profile_id === 'string' ? row.profile_id : ''
        const imageId = typeof row.image_id === 'string' ? row.image_id : ''
        const captionId = getRowId(row)
        const ratingSummary = captionId ? ratingStatsByCaptionId[captionId] : undefined
        const ratingBlob = ratingSummary
          ? `${ratingSummary.count} ${formatRatingAverage(ratingSummary.average)}`
          : ''
        const blob = `${content} ${profileId} ${imageId} ${ratingBlob}`.toLowerCase()
        return blob.includes(query.toLowerCase())
      }),
    [query, ratingStatsByCaptionId, rows]
  )

  const publicCount = rows.filter((row) => row.is_public === true).length
  const withFlavor = rows.filter((row) => row.humor_flavor_id !== null && row.humor_flavor_id !== undefined).length
  const ratedCaptions = rows.filter((row) => {
    const captionId = getRowId(row)
    return captionId ? Boolean(ratingStatsByCaptionId[captionId]) : false
  }).length
  const totalRatings = Object.values(ratingStatsByCaptionId).reduce((sum, item) => sum + item.count, 0)
  const averageRatingsPerRatedCaption = ratedCaptions ? totalRatings / ratedCaptions : 0
  const averageScoreAcrossRatings = averageOfAverages(Object.values(ratingStatsByCaptionId))
  const flavorSummary = useMemo(() => buildFlavorSummary(rows, ratingStatsByCaptionId), [rows, ratingStatsByCaptionId])

  return (
    <AdminFrame
      section="captions"
      title="Captions"
      subtitle="Read-only table of caption rows with linked profile/image references and live rating activity."
    >
      <section className="insight-grid">
        <article className="insight-card">
          <p className="eyebrow">Captions</p>
          <strong>{rows.length.toLocaleString()}</strong>
          <small>Total caption rows</small>
        </article>
        <article className="insight-card">
          <p className="eyebrow">Visibility</p>
          <strong>{publicCount.toLocaleString()}</strong>
          <small>Public captions</small>
        </article>
        <article className="insight-card">
          <p className="eyebrow">Pipeline</p>
          <strong>{withFlavor.toLocaleString()}</strong>
          <small>Assigned to flavor</small>
        </article>
        <article className="insight-card">
          <p className="eyebrow">Being Rated</p>
          <strong>{ratedCaptions.toLocaleString()}</strong>
          <small>Captions with user ratings</small>
        </article>
        <article className="insight-card">
          <p className="eyebrow">Rating Volume</p>
          <strong>{totalRatings.toLocaleString()}</strong>
          <small>{ratingTableName ? `From ${ratingTableName}` : 'No rating table found'}</small>
        </article>
        <article className="insight-card">
          <p className="eyebrow">Avg Ratings</p>
          <strong>{averageRatingsPerRatedCaption.toFixed(1)}</strong>
          <small>Per rated caption</small>
        </article>
        <article className="insight-card">
          <p className="eyebrow">Avg Score</p>
          <strong>{formatRatingAverage(averageScoreAcrossRatings)}</strong>
          <small>Across numeric ratings</small>
        </article>
      </section>

      <section className="panel resource-search-panel">
        <div className="resource-section-head">
          <div>
            <h2>Rating summary by humor flavor</h2>
            <p className="sub">Shows where users are actually rating captions and which flavors are performing best.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Flavor</th>
                <th>Captions</th>
                <th>Rated Captions</th>
                <th>Total Ratings</th>
                <th>Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {flavorSummary.map((item) => (
                <tr key={item.flavorLabel}>
                  <td>{item.flavorLabel}</td>
                  <td>{item.captionCount.toLocaleString()}</td>
                  <td>{item.ratedCaptionCount.toLocaleString()}</td>
                  <td>{item.ratingCount.toLocaleString()}</td>
                  <td>{formatRatingAverage(item.averageScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <input
        className="input search-input"
        placeholder="Search caption text, profile_id, image_id, or rating summary"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="result-meta">
        Showing {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} captions
      </p>
      {error && <p className="notice error">{error}</p>}
      {loading ? (
        <p className="sub">Loading captions…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Caption</th>
                <th>Ratings</th>
                <th>Visibility</th>
                <th>Flavor</th>
                <th>References</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => {
                const id = typeof row.id === 'string' ? row.id : `caption-${index}`
                const captionId = getRowId(row)
                const ratingSummary = captionId ? ratingStatsByCaptionId[captionId] : undefined
                return (
                  <tr key={id}>
                    <td>{typeof row.content === 'string' ? row.content : '—'}</td>
                    <td>
                      {ratingSummary ? (
                        <div>
                          <div>{ratingSummary.count.toLocaleString()} ratings</div>
                          <div className="mono">
                            avg {formatRatingAverage(ratingSummary.average)}
                            {ratingSummary.latestAt ? ` · ${formatTimestamp(ratingSummary.latestAt)}` : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="tag muted">No ratings</span>
                      )}
                    </td>
                    <td>{row.is_public === true ? <span className="tag">Public</span> : <span className="tag muted">Private</span>}</td>
                    <td className="mono">{typeof row.humor_flavor_id === 'number' ? row.humor_flavor_id : '—'}</td>
                    <td>
                      <div className="mono">P: {typeof row.profile_id === 'string' ? row.profile_id.slice(0, 8) : '—'}</div>
                      <div className="mono">I: {typeof row.image_id === 'string' ? row.image_id.slice(0, 8) : '—'}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No captions found</h3>
              <p>Try searching by caption text, profile reference, or image reference.</p>
            </div>
          )}
        </div>
      )}
    </AdminFrame>
  )
}

function buildRatingAggregates(rows: CaptionRow[]) {
  const aggregates = new Map<string, { count: number; total: number; numericCount: number; latestAt: string | null }>()

  for (const row of rows) {
    const captionId = getCaptionIdFromRating(row)
    if (!captionId) continue

    const current = aggregates.get(captionId) ?? {
      count: 0,
      total: 0,
      numericCount: 0,
      latestAt: null,
    }
    current.count += 1

    const numericValue = getNumericRatingValue(row)
    if (numericValue !== null) {
      current.total += numericValue
      current.numericCount += 1
    }

    const timestamp = getLatestTimestamp(row)
    if (timestamp && (!current.latestAt || timestamp > current.latestAt)) {
      current.latestAt = timestamp
    }

    aggregates.set(captionId, current)
  }

  return Object.fromEntries(
    [...aggregates.entries()].map(([captionId, value]) => [
      captionId,
      {
        count: value.count,
        average: value.numericCount ? value.total / value.numericCount : null,
        latestAt: value.latestAt,
      },
    ])
  )
}

function getRowId(row: CaptionRow) {
  if (typeof row.id === 'string' || typeof row.id === 'number') return String(row.id)
  return null
}

function getCaptionIdFromRating(row: CaptionRow) {
  const value = row.caption_id ?? row.captionId ?? row.captionID
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

function getNumericRatingValue(row: CaptionRow) {
  const candidates = [row.rating, row.score, row.value, row.vote, row.stars]
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string' && candidate.trim()) {
      const parsed = Number(candidate)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function getLatestTimestamp(row: CaptionRow) {
  const candidates = [row.created_at, row.updated_at, row.created_datetime_utc, row.modified_datetime_utc]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && !Number.isNaN(new Date(candidate).getTime())) return candidate
  }
  return null
}

function averageOfAverages(stats: RatingAggregate[]) {
  const numeric = stats.filter((item) => item.average !== null)
  if (!numeric.length) return null
  return numeric.reduce((sum, item) => sum + (item.average ?? 0), 0) / numeric.length
}

function buildFlavorSummary(rows: CaptionRow[], ratingStatsByCaptionId: Record<string, RatingAggregate>) {
  const byFlavor = new Map<string, { captionCount: number; ratedCaptionCount: number; ratingCount: number; scoreTotal: number; scoreCount: number }>()

  for (const row of rows) {
    const flavorLabel =
      typeof row.humor_flavor_id === 'number' || typeof row.humor_flavor_id === 'string'
        ? `Flavor ${String(row.humor_flavor_id)}`
        : 'Unassigned'
    const current = byFlavor.get(flavorLabel) ?? {
      captionCount: 0,
      ratedCaptionCount: 0,
      ratingCount: 0,
      scoreTotal: 0,
      scoreCount: 0,
    }
    current.captionCount += 1

    const captionId = getRowId(row)
    const ratingSummary = captionId ? ratingStatsByCaptionId[captionId] : undefined
    if (ratingSummary) {
      current.ratedCaptionCount += 1
      current.ratingCount += ratingSummary.count
      if (ratingSummary.average !== null) {
        current.scoreTotal += ratingSummary.average
        current.scoreCount += 1
      }
    }

    byFlavor.set(flavorLabel, current)
  }

  return [...byFlavor.entries()]
    .map(([flavorLabel, value]) => ({
      flavorLabel,
      captionCount: value.captionCount,
      ratedCaptionCount: value.ratedCaptionCount,
      ratingCount: value.ratingCount,
      averageScore: value.scoreCount ? value.scoreTotal / value.scoreCount : null,
    }))
    .sort((a, b) => b.ratingCount - a.ratingCount || b.captionCount - a.captionCount)
}

function formatRatingAverage(value: number | null) {
  if (value === null) return '—'
  return value.toFixed(2)
}

function formatTimestamp(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}
