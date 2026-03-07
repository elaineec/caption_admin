import Link from 'next/link'
import AdminFrame from '../components/AdminFrame'
import { ADMIN_RESOURCES } from '../lib/admin-resources'

export default function ResourcesPage() {
  return (
    <AdminFrame
      section="resources"
      title="Data Resources"
      subtitle="All required datasets for read and CRUD operations."
    >
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
