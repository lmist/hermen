// Signed voice token: binds a Masky conversation to one user + persona so clients can't point /api/speak at arbitrary conversations.
const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Uint8Array | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    return Uint8Array.from(bin, (c) => c.charCodeAt(0))
  } catch {
    return null
  }
}

async function hmac(payload: string): Promise<Uint8Array | null> {
  const secret = process.env.SESSION_SECRET
  if (!secret) return null
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)))
}

export async function signVoiceToken(
  conv: { conversationId: string; shareSlug: string },
  sub: string,
  persona: string,
): Promise<string | null> {
  const body = `${conv.conversationId}.${conv.shareSlug}`
  const mac = await hmac(`${body}.${sub}.${persona}`)
  if (!mac) return null
  return `${b64url(enc.encode(body))}.${b64url(mac)}`
}

export async function verifyVoiceToken(
  token: unknown,
  sub: string,
  persona: string,
): Promise<{ conversationId: string; shareSlug: string } | null> {
  if (typeof token !== 'string') return null
  const [bodyPart, macPart, extra] = token.split('.')
  if (!bodyPart || !macPart || extra !== undefined) return null
  const bodyBytes = fromB64url(bodyPart)
  const macBytes = fromB64url(macPart)
  if (!bodyBytes || !macBytes) return null
  const body = new TextDecoder().decode(bodyBytes)
  const expected = await hmac(`${body}.${sub}.${persona}`)
  if (!expected || expected.length !== macBytes.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ macBytes[i]
  if (diff !== 0) return null
  const [conversationId, shareSlug, more] = body.split('.')
  if (!conversationId || !shareSlug || more !== undefined) return null
  return { conversationId, shareSlug }
}
