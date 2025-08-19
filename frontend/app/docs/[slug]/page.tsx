import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import { renderMarkdown } from "@/src/lib/markdown"

const DOCS_PATH = path.join(process.cwd(), "docs")

export default async function DocPage({ params }: { params: { slug: string } }) {
  const filePath = path.join(DOCS_PATH, `${params.slug}.md`)
  if (!fs.existsSync(filePath)) return notFound()

  const raw = fs.readFileSync(filePath, "utf-8")
  const html = renderMarkdown(raw)

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="prose prose-neutral max-w-4xl mx-auto" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
} 