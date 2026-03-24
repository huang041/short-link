import { describe, it, expect } from 'vitest'
import { isSocialBot } from './bot'

describe('isSocialBot', () => {
  it.each([
    'facebookexternalhit/1.1',
    'Facebot',
    'Twitterbot/1.0',
    'LinkedInBot/1.0',
    'Slackbot-LinkExpanding 1.0',
    'TelegramBot (like TwitterBot)',
    'Discordbot/2.0',
    'WhatsApp/2.23.1',
    'LINE/10.0.0',
    'Googlebot/2.1',
  ])('should detect %s as a bot', (ua) => {
    expect(isSocialBot(ua)).toBe(true)
  })

  it.each([
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    'curl/7.88.1',
    '',
  ])('should not detect %s as a bot', (ua) => {
    expect(isSocialBot(ua)).toBe(false)
  })
})
