// OWNER: auth agent (bead hermen-wgg.6). Signed cookie session for Login with Masky.
export interface Session {
  /** Stable Masky pseudonym for (user, app, avatar). Use it as the account id. */
  sub: string
  name: string
  picture: string | null
}

export type AuthMode = 'masky' | 'open'

export const SESSION_COOKIE = 'hermen_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30

export function authMode(): AuthMode {
  return process.env.AUTH_MODE === 'masky' ? 'masky' : 'open'
}

const enc = new TextEncoder()

function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(text: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (text.length % 4)) % 4)
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/') + pad)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function hmacKey(): Promise<CryptoKey | null> {
  const secret = process.env.SESSION_SECRET
  if (!secret) return null
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

/** Build the cookie value: base64url(JSON {sub,name,picture,exp}) + "." + base64url(HMAC). */
export async function signSession(session: Session): Promise<string | null> {
  const key = await hmacKey()
  if (!key) return null
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = b64urlEncode(enc.encode(JSON.stringify({ ...session, exp })))
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return `${payload}.${b64urlEncode(new Uint8Array(sig))}`
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim()
  }
  return null
}

/** Read and verify the signed `hermen_session` cookie. Returns null when signed out. */
export async function getSession(request: Request): Promise<Session | null> {
  try {
    const value = readCookie(request.headers.get('cookie'), SESSION_COOKIE)
    if (!value) return null
    const [payload, sig] = value.split('.')
    if (!payload || !sig) return null
    const key = await hmacKey()
    if (!key) return null
    const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(payload))
    if (!ok) return null
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)))
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null
    if (typeof data.sub !== 'string' || !data.sub) return null
    return {
      sub: data.sub,
      name: typeof data.name === 'string' ? data.name : '',
      picture: typeof data.picture === 'string' ? data.picture : null,
    }
  } catch {
    return null
  }
}

/** Same as getSession, for use inside createServerFn handlers (reads the current request). */
export async function getRequestSession(): Promise<Session | null> {
  const { getRequest } = await import('@tanstack/react-start/server')
  return getSession(getRequest())
}
