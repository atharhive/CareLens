export function renderMarkdown(markdown: string): string {
  let html = markdown

    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Code fences ```
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre class="whitespace-pre-wrap bg-muted p-4 rounded-md overflow-x-auto"><code>${code.trim()}</code></pre>`
  })

  // Headings ###### to #
  html = html.replace(/^######\s?(.*)$/gm, '<h6 class="mt-6 mb-2 text-sm font-semibold">$1</h6>')
  html = html.replace(/^#####\s?(.*)$/gm, '<h5 class="mt-6 mb-2 text-base font-semibold">$1</h5>')
  html = html.replace(/^####\s?(.*)$/gm, '<h4 class="mt-6 mb-2 text-lg font-semibold">$1</h4>')
  html = html.replace(/^###\s?(.*)$/gm, '<h3 class="mt-8 mb-3 text-xl font-bold">$1</h3>')
  html = html.replace(/^##\s?(.*)$/gm, '<h2 class="mt-10 mb-4 text-2xl font-bold">$1</h2>')
  html = html.replace(/^#\s?(.*)$/gm, '<h1 class="mt-12 mb-6 text-3xl font-extrabold">$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded">$1</code>')

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline-offset-2 hover:underline">$1<\/a>')

  // Lists - or * start
  html = html.replace(/^(?:\s*[-*]\s+.+(?:\r?\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
      .map((item) => `<li class="ml-6 list-disc">${item}</li>`) 
      .join("")
    return `<ul class="my-4">${items}</ul>`
  })

  // Paragraphs: wrap standalone lines that are not HTML blocks
  html = html.replace(/^(?!\s*<)(?!\s*<\/)(?!\s*<li)(?!\s*<h\d)(?!\s*<pre)(?!\s*<ul)(?!\s*<hr)(.+)$/gm, '<p class="my-3">$1</p>')

  return html
} 