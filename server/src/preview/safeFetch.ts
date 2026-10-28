import http from 'http'
import https from 'https'
import dns from 'dns'
import net from 'net'

const MAX_REDIRECTS = 3
const MAX_BYTES = 1024 * 1024
const TIMEOUT_MS = 5000

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local, cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast / reserved
    )
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateIp(mapped[1])
    return (
      lower === '::' ||
      lower === '::1' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      /^fe[89ab]/.test(lower) ||
      lower.startsWith('ff')
    )
  }
  return true
}

// Validates the resolved address at connect time, so DNS rebinding can't bypass the check.
const guardedLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 4)
    const list = addresses as dns.LookupAddress[]
    const allowed = list.filter((a) => !isPrivateIp(a.address))
    if (allowed.length === 0 || allowed.length !== list.length) {
      return callback(new Error(`Blocked address for host ${hostname}`), '', 4)
    }
    if ((options as dns.LookupOptions).all) {
      return (callback as any)(null, allowed)
    }
    callback(null, allowed[0].address, allowed[0].family)
  })
}

function requestOnce(url: URL): Promise<{ status: number; location?: string; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http
    const req = client.request(
      url,
      { method: 'GET', headers: { 'User-Agent': 'bot' }, lookup: guardedLookup, timeout: TIMEOUT_MS },
      (res) => {
        const status = res.statusCode || 0
        const location = res.headers.location
        const chunks: Buffer[] = []
        let size = 0
        res.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > MAX_BYTES) {
            res.destroy()
            return
          }
          chunks.push(chunk)
        })
        res.on('close', () => resolve({ status, location, body: Buffer.concat(chunks).toString('utf8') }))
        res.on('error', reject)
      },
    )
    req.on('timeout', () => req.destroy(new Error('Request timed out')))
    req.on('error', reject)
    req.end()
  })
}

export async function safeFetchText(rawUrl: string): Promise<string> {
  let url = new URL(rawUrl)
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Only http/https URLs are allowed')
    }
    // literal IPs skip DNS lookup, so check them directly
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(host) && isPrivateIp(host)) throw new Error('Blocked address')

    const res = await requestOnce(url)
    if (res.status >= 300 && res.status < 400 && res.location) {
      url = new URL(res.location, url)
      continue
    }
    return res.body
  }
  throw new Error('Too many redirects')
}
