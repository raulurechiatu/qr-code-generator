export function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return { deviceType: 'unknown', browser: 'unknown' }

  const ua = userAgent.toLowerCase()

  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'desktop'
  if (/ipad|tablet/.test(ua)) {
    deviceType = 'tablet'
  } else if (/mobi|iphone|android/.test(ua)) {
    deviceType = 'mobile'
  }

  let browser = 'unknown'
  if (ua.includes('edg/')) browser = 'Edge'
  else if (ua.includes('chrome/')) browser = 'Chrome'
  else if (ua.includes('firefox/')) browser = 'Firefox'
  else if (ua.includes('safari/')) browser = 'Safari'

  return { deviceType, browser }
}
