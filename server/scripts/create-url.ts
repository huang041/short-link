// Usage:
//   npx ts-node scripts/create-url.ts <longUrl> [campaign]
//
// Examples:
//   npx ts-node scripts/create-url.ts https://www.google.com
//   npx ts-node scripts/create-url.ts https://www.google.com summer_sale

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function createShortUrl(longUrl: string, campaign?: string) {
  const res = await fetch(`${BASE_URL}/api/urls/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ longUrl, campaign }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to create short URL: ${error}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  console.log('Created:', data)
  console.log(`Short URL: ${BASE_URL}/${data.shortCode}`)
}

const [longUrl, campaign] = process.argv.slice(2)

if (!longUrl) {
  console.error('Usage: ts-node scripts/create-url.ts <longUrl> [campaign]')
  process.exit(1)
}

createShortUrl(longUrl, campaign).catch(console.error)
