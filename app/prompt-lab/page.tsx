'use client'

import { FormEvent, useState } from 'react'
import AdminFrame from '../components/AdminFrame'

export default function PromptLabPage() {
  const [endpoint, setEndpoint] = useState('/pipeline/generate_captions')
  const [payloadText, setPayloadText] = useState('{\n  "image_id": "",\n  "humor_flavor_id": 1\n}')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = JSON.parse(payloadText) as unknown
      const response = await fetch('/api/prompt-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, payload }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(typeof result?.error === 'string' ? result.error : 'Prompt test failed.')
      }

      setResponseText(JSON.stringify(result, null, 2))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid request.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminFrame
      section="prompt-lab"
      title="Prompt Lab"
      subtitle="Test humor flavors against the caption generation API with your current prompt chain."
    >
      <section className="panel">
        <h2>Generate captions from API</h2>
        <p className="sub">
          This tool sends test requests to <code>api.almostcrackd.ai</code> and lets you inspect raw output.
        </p>
        <form className="form-grid" onSubmit={onSubmit}>
          <input className="input" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
          <textarea
            className="input"
            rows={10}
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
          />
          <div className="row-actions">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Generating…' : 'Run prompt chain test'}
            </button>
          </div>
        </form>
      </section>

      {error && <p className="notice error">{error}</p>}
      {responseText && (
        <section className="panel">
          <h2>API response</h2>
          <pre className="code-block">{responseText}</pre>
        </section>
      )}
    </AdminFrame>
  )
}
