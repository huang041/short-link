export interface OgTags {
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export const ogService = {
  async fetch(url: string): Promise<OgTags> {
    // TODO: fetch URL, parse <meta og:*> tags
    throw new Error('Not implemented')
  },

  buildPreviewHtml(ogTags: OgTags, redirectUrl: string): string {
    // TODO: return HTML with OG meta tags + JS redirect for non-bots
    throw new Error('Not implemented')
  },
}
