import Link from 'next/link'
import AdminFrame from '../components/AdminFrame'
import { ADMIN_RESOURCES } from '../lib/admin-resources'

export default function ResourcesPage() {
  return (
    <AdminFrame
      section="resources"
      title="Data Resources"
      subtitle="All required datasets for read and CRUD operations in one place."
    >
      <section className="panel">
        <div className="resource-header">
          <div>
            <h2>Resource Directory</h2>
            <p className="sub">Open any dataset to inspect records or run mutations based on assignment scope.</p>
          </div>
          <span className="status">{ADMIN_RESOURCES.length} resources</span>
        </div>
      </section>
      <section className="resource-grid">
        {ADMIN_RESOURCES.map((resource) => (
          <article key={resource.slug} className="panel">
            <p className="eyebrow">{resource.mode.toUpperCase()}</p>
            <h2>{resource.title}</h2>
            <p className="sub">{resource.description}</p>
            <Link className="btn ghost" href={`/resources/${resource.slug}`}>
              Open table
            </Link>
          </article>
        ))}
      </section>
    </AdminFrame>
  )
}
