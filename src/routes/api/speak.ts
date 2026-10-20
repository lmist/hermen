// POST /api/speak { persona, text, voiceToken? } -> { audioUrl, voiceToken }
// One chunk of a guide reply, spoken in the guide's Masky voice.
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { isPersonaId, splitForSpeech, toSpeakable } from '#/lib/hermen'
import { json } from '#/lib/ai/messages'
import { getSession } from '#/lib/session'
import { signVoiceToken, verifyVoiceToken } from '#/lib/ai/voice-token'
import { createConversation, postTurn, waitForAudio } from '#/lib/ai/masky-voice'

type Limiter = { limit(o: { key: string }): Promise<{ success: boolean }> }

export const Route = createFileRoute('/api/speak')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getSession(request)
        if (!session) return json({ error: 'signed_out' }, 401)

        const limiter = (env as unknown as { SPEAK_LIMITER?: Limiter }).SPEAK_LIMITER
        if (limiter && !(await limiter.limit({ key: session.sub })).success) {
          return json({ error: 'rate_limited' }, 429)
        }

        const body: any = await request.json().catch(() => null)
        const persona = body?.persona
        const text = typeof body?.text === 'string' ? toSpeakable(body.text) : ''
        if (!isPersonaId(persona) || text.length < 1 || text.length > 480 || splitForSpeech(text).length !== 1) {
          return json({ error: 'bad_request' }, 400)
        }

        try {
          let conv = await verifyVoiceToken(body?.voiceToken, session.sub, persona)
          let voiceToken: string | null = conv ? body.voiceToken : null
          if (!conv) {
            conv = await createConversation(persona)
            voiceToken = await signVoiceToken(conv, session.sub, persona)
            if (!voiceToken) throw new Error('no token')
          }
          const turnId = await postTurn(conv.conversationId, text)
          const audioUrl = await waitForAudio(conv.shareSlug, turnId)
          return json({ audioUrl, voiceToken })
        } catch (error: any) {
          console.error('[api/speak] failed', error?.name)
          return json({ error: 'voice_failed' }, 502)
        }
      },
    },
  },
})
