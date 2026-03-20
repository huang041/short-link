export interface OgTags {
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export const ogService = {
  async fetch(url: string): Promise<OgTags> {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'bot' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

    return {
      title: extractMeta(html, 'og:title') || extractTag(html, 'title'),
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description'),
      image: extractMeta(html, 'og:image'),
      siteName: extractMeta(html, 'og:site_name'),
    }
  },

  buildPreviewHtml(ogTags: OgTags, redirectUrl: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  ${ogTags.title ? `<meta property="og:title" content="${esc(ogTags.title)}">` : ''}
  ${ogTags.description ? `<meta property="og:description" content="${esc(ogTags.description)}">` : ''}
  ${ogTags.image ? `<meta property="og:image" content="${esc(ogTags.image)}">` : ''}
  ${ogTags.siteName ? `<meta property="og:site_name" content="${esc(ogTags.siteName)}">` : ''}
  <meta http-equiv="refresh" content="0;url=${esc(redirectUrl)}">
  <title>${esc(ogTags.title || '')}</title>
</head>
<body>
  <p>Redirecting to <a href="${esc(redirectUrl)}">${esc(redirectUrl)}</a></p>
</body>
</html>`
  },
}

function extractMeta(html: string, property: string): string | undefined {
  // match both property="og:xxx" and name="description"
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']` +
    `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    'i'
  )
  const match = html.match(regex)
  return match?.[1] || match?.[2] || undefined
}

function extractTag(html: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
  return html.match(regex)?.[1]?.trim() || undefined
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
