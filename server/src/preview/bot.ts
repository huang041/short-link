const BOT_PATTERNS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'WhatsApp',
  'LINE',
  'Googlebot',
]

export function isSocialBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => userAgent.includes(pattern))
}
