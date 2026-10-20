// Masky helpers for voice mode: conversation, spoken turn, poll for the audio clip.
import { MASKY_VOICES, VOICE_STYLE, type PersonaId } from '#/lib/hermen'

const BASE = 'https://masky.ai/api/conversations'
const POLL_MS = 1000
const POLL_TIMEOUT_MS = 20_000

export class MaskyVoiceError extends Error {}

function headers() {
  const key = process.env.MASKY_API_KEY
  if (!key) throw new MaskyVoiceError('missing key')
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
}

async function call(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, headers: headers(), signal: AbortSignal.timeout(15_000) })
  if (!res.ok) {
    console.error('[masky-voice] status', res.status)
    throw new MaskyVoiceError(`status ${res.status}`)
  }
  return res.json()
}

export async function createConversation(persona: PersonaId) {
  const { avatarOwnerUserId, avatarId } = MASKY_VOICES[persona]
  const data = await call(BASE, { method: 'POST', body: JSON.stringify({ avatarOwnerUserId, avatarId }) })
  if (!data?.conversationId || !data?.shareSlug) throw new MaskyVoiceError('bad conversation')
  return { conversationId: String(data.conversationId), shareSlug: String(data.shareSlug) }
}

export async function postTurn(conversationId: string, text: string): Promise<string> {
  const data = await call(`${BASE}/${encodeURIComponent(conversationId)}/turn`, {
    method: 'POST',
    body: JSON.stringify({ userText: text, mode: 'speak', output: 'audio', voiceStyle: VOICE_STYLE }),
  })
  const id = data?.turn?.id
  if (!id) throw new MaskyVoiceError('bad turn')
  return String(id)
}

export async function waitForAudio(shareSlug: string, turnId: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    const data = await call(`${BASE}/by-slug/${encodeURIComponent(shareSlug)}`, { method: 'GET' })
    const turn = Array.isArray(data?.turns) ? data.turns.find((t: any) => t?.id === turnId) : null
    if (turn?.status === 'error') {
      console.error('[masky-voice] turn error')
      throw new MaskyVoiceError('turn error')
    }
    if (turn?.audioUrl) return String(turn.audioUrl)
  }
  console.error('[masky-voice] timeout')
  throw new MaskyVoiceError('timeout')
}
