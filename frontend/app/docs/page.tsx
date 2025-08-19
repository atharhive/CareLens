import fs from "fs"
import path from "path"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DOCS_PATH = path.join(process.cwd(), "docs")

export default async function DocsIndexPage() {
  const files = fs
    .readdirSync(DOCS_PATH)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => ({
      filename,
      slug: filename.replace(/\.md$/, ""),
      title: filename
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\.md$/, ""),
    }))

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground">Project guides and references rendered from the repository's docs.</p>
        </div>

        <div className="grid gap-4">
          {files.map(({ slug, title }) => (
            <Card key={slug} className="hover:bg-muted/30 transition-colors">
              <CardHeader>
                <CardTitle>
                  <Link className="underline-offset-2 hover:underline" href={`/docs/${slug}`}>{title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">docs/{slug}.md</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 