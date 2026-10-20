// Usage (UI):
//   import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
//   const { messages, sendMessage, isLoading, error, stop } = useChat({
//     connection: fetchServerSentEvents(
//       `/api/chat?persona=${persona}&intake=${encodeURIComponent(JSON.stringify(intake))}`,
//     ),
//   })
//   sendMessage('I want to tell my therapist about my dad.')
// Reconnect (new connection object) when persona or intake changes.
import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { CRISIS_MESSAGE, CRISIS_RESOURCES, detectCrisis, systemPrompt } from '#/lib/hermen'
import { anthropicConfig, json, normalizeMessages, readContext } from '#/lib/ai/messages'

function crisisText() {
  const lines = CRISIS_RESOURCES.map((r) => `- ${r.label}${r.detail ? ` (${r.detail})` : ''}`)
  return `${CRISIS_MESSAGE}\n\n${lines.join('\n')}`
}

// Static crisis reply as an AG-UI stream: never needs the model.
function crisisResponse(abortController: AbortController) {
  const threadId = `crisis-${Date.now()}`
  const runId = `run-${Date.now()}`
  const messageId = `msg-${Date.now()}`
  const t = () => Date.now()
  async function* events(): AsyncGenerator<any> {
    yield { type: 'RUN_STARTED', threadId, runId, timestamp: t() }
    yield { type: 'TEXT_MESSAGE_START', messageId, role: 'assistant', timestamp: t() }
    yield { type: 'TEXT_MESSAGE_CONTENT', messageId, delta: crisisText(), timestamp: t() }
    yield { type: 'TEXT_MESSAGE_END', messageId, timestamp: t() }
    yield { type: 'RUN_FINISHED', threadId, runId, timestamp: t() }
  }
  return toServerSentEventsResponse(events(), { abortController })
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.signal.aborted) return new Response(null, { status: 499 })
        const abortController = new AbortController()
        try {
          const body: any = await request.json().catch(() => ({}))
          const { persona, intake } = readContext(new URL(request.url), body)
          const messages = normalizeMessages(body?.messages ?? body?.data?.messages)
          if (!messages.length) return json({ error: 'No messages' }, 400)
          const latestUser = [...messages].reverse().find((m) => m.role === 'user')

          // Server-enforced crisis stop: static reply, no model call.
          if (detectCrisis(latestUser?.content ?? '')) return crisisResponse(abortController)
          if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'AI not configured' }, 503)

          const stream = chat({
            adapter: anthropicText('claude-sonnet-5-5', anthropicConfig()),
            systemPrompts: [
              systemPrompt(persona, 'chat', intake, {
                crisis: detectCrisis(latestUser?.content ?? ''),
              }),
            ],
            messages,
            modelOptions: { max_tokens: 600 },
            abortController,
          })
          return toServerSentEventsResponse(stream, { abortController })
        } catch (error: any) {
          if (error?.name === 'AbortError' || abortController.signal.aborted) {
            return new Response(null, { status: 499 })
          }
          console.error('[api/chat]', error?.message ?? error)
          return json({ error: 'Failed to process chat request' }, 502)
        }
      },
    },
  },
})
