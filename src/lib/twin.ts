const SUPABASE_URL = 'https://bxewkghaljeucxekwltd.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZXdrZ2hhbGpldWN4ZWt3bHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjg0MzIsImV4cCI6MjA5MTk0NDQzMn0.Efo4opmFKm9TFrKamH4Yvg44nIXP8sD9JhH5Rq7KaqM'
const TWIN_URL = 'https://solnova.app'
const SESSION_KEY = 'solnova_twin_session'

interface TwinSession {
  access_token: string
  refresh_token: string
  expires_at: number
}

async function getTwinToken(): Promise<string | null> {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const session: TwinSession | null = raw ? JSON.parse(raw) : null
    if (session && session.expires_at > Date.now() / 1000 + 60) {
      return session.access_token
    }
    if (session?.refresh_token) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      })
      if (res.ok) {
        const data = await res.json()
        const next: TwinSession = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at }
        localStorage.setItem(SESSION_KEY, JSON.stringify(next))
        return next.access_token
      }
    }
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({}),
    })
    if (!res.ok) return null
    const data = await res.json()
    const next: TwinSession = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    return next.access_token
  } catch {
    return null
  }
}

export function contributeToTwin(appId: string, rawData: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  getTwinToken().then((token) => {
    if (!token) return
    fetch(`${TWIN_URL}/api/twin/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ app_id: appId, raw_data: rawData }),
    }).catch((e) => console.error('[solnova-twin]', e))
  })
}
