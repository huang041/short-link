import { describe, it, expect } from 'vitest'
import { isPrivateIp, safeFetchText } from './safeFetch'

describe('isPrivateIp', () => {
  it.each(['127.0.0.1', '10.1.2.3', '169.254.169.254', '172.16.0.1', '192.168.1.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1'])(
    'blocks %s',
    (ip) => expect(isPrivateIp(ip)).toBe(true),
  )
  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('allows %s', (ip) =>
    expect(isPrivateIp(ip)).toBe(false),
  )
})

describe('safeFetchText', () => {
  it('rejects non-http protocols', async () => {
    await expect(safeFetchText('file:///etc/passwd')).rejects.toThrow()
  })
  it('rejects literal private IPs', async () => {
    await expect(safeFetchText('http://169.254.169.254/latest/meta-data')).rejects.toThrow('Blocked')
    await expect(safeFetchText('http://[::1]/')).rejects.toThrow('Blocked')
  })
  it('rejects hostnames resolving to loopback', async () => {
    await expect(safeFetchText('http://localhost/')).rejects.toThrow()
  })
})
