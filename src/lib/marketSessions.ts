export type Session = 'Asia' | 'EU' | 'US' | 'Closed'

export function getSession(now: Date = new Date()): Session {
  const hour = now.getUTCHours()
  if (hour >= 0 && hour < 8) return 'Asia'
  if (hour >= 8 && hour < 16) return 'EU'
  if (hour >= 13 && hour < 21) return 'US'
  return 'Closed'
}

export function nyseCountdown(now: Date = new Date()): { label: string; seconds: number } {
  const nyNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  )
  const open = new Date(nyNow)
  open.setHours(9, 30, 0, 0)
  const close = new Date(nyNow)
  close.setHours(16, 0, 0, 0)

  if (nyNow < open) {
    return { label: 'Opens in', seconds: Math.floor((open.getTime() - nyNow.getTime()) / 1000) }
  }
  if (nyNow < close) {
    return { label: 'Closes in', seconds: Math.floor((close.getTime() - nyNow.getTime()) / 1000) }
  }
  const nextOpen = new Date(open)
  nextOpen.setDate(open.getDate() + 1)
  return { label: 'Opens in', seconds: Math.floor((nextOpen.getTime() - nyNow.getTime()) / 1000) }
}
