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
import { detectCrisis, systemPrompt } from '#/lib/hermen'
import { json, normalizeMessages, readContext } from '#/lib/ai/messages'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.signal.aborted) return new Response(null, { status: 499 })
        if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'AI not configured' }, 503)

        const abortController = new AbortController()
        try {
          const body: any = await request.json().catch(() => ({}))
          const { persona, intake } = readContext(new URL(request.url), body)
          const messages = normalizeMessages(body?.messages ?? body?.data?.messages)
          if (!messages.length) return json({ error: 'No messages' }, 400)
          const latestUser = [...messages].reverse().find((m) => m.role === 'user')

          const stream = chat({
            adapter: anthropicText('claude-sonnet-5-5'),
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
          return json({ error: 'Failed to process chat request' }, 502)
        }
      },
    },
  },
})
