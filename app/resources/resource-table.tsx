'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'
import type { AdminResource } from '../lib/admin-resources'

type GenericRow = Record<string, unknown>

type ResourceTableProps = {
  resource: AdminResource
}

export default function ResourceTable({ resource }: ResourceTableProps) {
  const [activeTable, setActiveTable] = useState<string | null>(null)
  const [rows, setRows] = useState<GenericRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorText, setEditorText] = useState('{\n  \n}')
  const [editKey, setEditKey] = useState<string | number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDescription, setUploadDescription] = useState('')
  const supabase = createSupabaseBrowserClient()

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
  }, [query, rows])

  const columns = useMemo(() => {
    const keys = new Set<string>()
    rows.slice(0, 80).forEach((row) => {
      Object.keys(row).forEach((key) => {
        keys.add(key)
      })
    })
    const ordered = [...keys]
    const prioritized = ['id', 'email', 'name', 'content', 'url', 'created_at']
    ordered.sort((a, b) => {
      const ai = prioritized.indexOf(a)
      const bi = prioritized.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    return ordered.slice(0, 8)
  }, [rows])

  const primaryKey = useMemo(() => inferPrimaryKey(rows), [rows])
  const canCreate = resource.mode === 'crud'
  const canDelete = resource.mode === 'crud'
  const canUpdate = resource.mode === 'crud' || resource.mode === 'update'
  const canUpload = resource.supportsImageUpload === true

  const loadRows = useCallback(async () => {
    if (!supabase) {
      setError('Missing Supabase environment variables.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let loadedTable: string | null = null
    let loadedRows: GenericRow[] = []
    let lastError: string | null = null

    for (const tableName of resource.tableCandidates) {
      const { data, error: loadError } = await supabase.from(tableName).select('*').limit(500)
      if (!loadError) {
        loadedTable = tableName
        loadedRows = (data ?? []) as GenericRow[]
        break
      }
      lastError = loadError.message
    }

    if (!loadedTable) {
      setError(lastError ?? `Unable to read resource table for ${resource.title}.`)
      setRows([])
      setActiveTable(null)
      setLoading(false)
      return
    }

    setActiveTable(loadedTable)
    setRows(loadedRows)
    setLoading(false)
  }, [resource.tableCandidates, resource.title, supabase])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  function parseEditorPayload() {
    try {
      const parsed = JSON.parse(editorText) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON payload must be an object.')
      }
      return parsed as GenericRow
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON payload.'
      throw new Error(message)
    }
  }

  async function handleCreateOrUpdate(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !activeTable) return
    setSaving(true)
    setError(null)

    try {
      const payload = parseEditorPayload()

      if (canUpdate && editKey !== null && primaryKey) {
        const { error: updateError } = await supabase
          .from(activeTable)
          .update(payload)
          .eq(primaryKey, editKey)
        if (updateError) throw updateError
      } else if (canCreate) {
        const { error: insertError } = await supabase.from(activeTable).insert(payload)
        if (insertError) throw insertError
      } else {
        throw new Error('This resource is not create-enabled.')
      }

      setEditorText('{\n  \n}')
      setEditKey(null)
      await loadRows()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  function beginEdit(row: GenericRow) {
    if (!canUpdate) return
    if (!primaryKey) {
      setError('No primary key detected for update operation.')
      return
    }

    const keyValue = row[primaryKey]
    if (typeof keyValue !== 'string' && typeof keyValue !== 'number') {
      setError('This row cannot be updated because the key value is not scalar.')
      return
    }

    const payload = { ...row }
    delete payload[primaryKey]
    setEditKey(keyValue)
    setEditorText(JSON.stringify(payload, null, 2))
  }

  async function handleDelete(row: GenericRow) {
    if (!supabase || !activeTable || !canDelete || !primaryKey) return
    const keyValue = row[primaryKey]
    if (typeof keyValue !== 'string' && typeof keyValue !== 'number') {
      setError('This row cannot be deleted because no scalar key was found.')
      return
    }
    setError(null)
    const { error: deleteError } = await supabase.from(activeTable).delete().eq(primaryKey, keyValue)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await loadRows()
  }

  async function handleImageUpload() {
    if (!supabase || !activeTable || !uploadFile || !canUpload) return
    setUploading(true)
    setError(null)

    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || 'images'
    const fileName = sanitizeFileName(uploadFile.name)
    const path = `admin/${Date.now()}-${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, uploadFile, { upsert: false, contentType: uploadFile.type || undefined })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(path)
    const publicUrl = publicData.publicUrl

    const payload: GenericRow = {
      url: publicUrl,
      image_description: uploadDescription.trim() || null,
    }

    const { error: insertError } = await supabase.from(activeTable).insert(payload)
    if (insertError) {
      setError(insertError.message)
      setUploading(false)
      return
    }

    setUploadFile(null)
    setUploadDescription('')
    await loadRows()
    setUploading(false)
  }

  return (
    <div className="admin-content">
      <section className="panel">
        <div className="resource-header">
          <div>
            <h2>{resource.title}</h2>
            <p className="sub">{resource.description}</p>
          </div>
          <div className="resource-meta">
            <span className="status">{resource.mode.toUpperCase()}</span>
            <span className="status">{activeTable ? `table: ${activeTable}` : 'table unresolved'}</span>
          </div>
        </div>
      </section>

      {canUpload && (
        <section className="panel">
          <h2>Upload image file</h2>
          <p className="sub">
            Uploads to Supabase Storage bucket <code>{process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || 'images'}</code>
            , then inserts an image row.
          </p>
          <div className="form-grid">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            />
            <input
              className="input"
              placeholder="Optional image description"
              value={uploadDescription}
              onChange={(event) => setUploadDescription(event.target.value)}
            />
            <button
              className="btn"
              type="button"
              onClick={handleImageUpload}
              disabled={uploading || !uploadFile}
            >
              {uploading ? 'Uploading…' : 'Upload + Insert row'}
            </button>
          </div>
        </section>
      )}

      {(canCreate || canUpdate) && (
        <section className="panel">
          <h2>
            {canUpdate && editKey !== null
              ? `Update row (${primaryKey}: ${String(editKey)})`
              : canCreate
                ? 'Create row'
                : 'Update row'}
          </h2>
          <p className="sub">Use JSON payloads for flexible schema-safe editing across all required tables.</p>
          <form className="form-grid" onSubmit={handleCreateOrUpdate}>
            <textarea
              className="input"
              rows={10}
              value={editorText}
              onChange={(event) => setEditorText(event.target.value)}
            />
            <div className="row-actions">
              <button className="btn" type="submit" disabled={saving || (!canCreate && editKey === null)}>
                {saving
                  ? 'Saving…'
                  : canUpdate && editKey !== null
                    ? 'Update row'
                    : canCreate
                      ? 'Create row'
                      : 'Save changes'}
              </button>
              {canUpdate && editKey !== null && (
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => {
                    setEditKey(null)
                    setEditorText('{\n  \n}')
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <input
        className="input search-input"
        placeholder="Search rows"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {error && <p className="notice error">{error}</p>}
      {loading ? (
        <p className="sub">Loading rows…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
                {(canUpdate || canDelete) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => {
                const rowId = rowKey(row, primaryKey, index)
                return (
                  <tr key={rowId}>
                    {columns.map((column) => (
                      <td key={`${rowId}-${column}`} className={column === 'id' ? 'mono' : undefined}>
                        {renderCellValue(column, row[column])}
                      </td>
                    ))}
                    {(canUpdate || canDelete) && (
                      <td>
                        <div className="row-actions">
                          {canUpdate && (
                            <button className="btn ghost" onClick={() => beginEdit(row)}>
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn danger" onClick={() => void handleDelete(row)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function inferPrimaryKey(rows: GenericRow[]) {
  if (!rows.length) return 'id'
  const firstRow = rows[0]
  if ('id' in firstRow) return 'id'
  const keyBySuffix = Object.keys(firstRow).find((key) => key.endsWith('_id'))
  return keyBySuffix ?? null
}

function rowKey(row: GenericRow, primaryKey: string | null, index: number) {
  if (primaryKey) {
    const value = row[primaryKey]
    if (typeof value === 'string' || typeof value === 'number') return String(value)
  }
  return `row-${index}`
}

function renderCellValue(column: string, value: unknown) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'string') {
    if (column === 'url' && value.startsWith('http')) {
      return (
        <a href={value} target="_blank" rel="noreferrer">
          Open URL
        </a>
      )
    }
    return value.length > 140 ? `${value.slice(0, 137)}...` : value
  }
  return JSON.stringify(value)
}

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-')
}
