import { createFileRoute } from '@tanstack/react-router'
import { chat } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { prepCardSchema, systemPrompt } from '#/lib/hermen'
import { json, normalizeMessages, readContext } from '#/lib/ai/messages'

export const Route = createFileRoute('/api/card')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'AI not configured' }, 503)
        try {
          const body: any = await request.json().catch(() => ({}))
          const { persona, intake } = readContext(new URL(request.url), body)
          const messages = normalizeMessages(body?.messages)
          if (!messages.length) return json({ error: 'No messages' }, 400)

          const card = await chat({
            adapter: anthropicText('claude-sonnet-5-5'),
            systemPrompts: [systemPrompt(persona, 'card', intake)],
            messages: [
              ...messages,
              { role: 'user', content: 'Make my one-page prep card from our conversation.' },
            ],
            outputSchema: prepCardSchema,
            modelOptions: { max_tokens: 2000 },
          })
          return json({ card })
        } catch {
          return json({ error: 'Failed to build prep card' }, 502)
        }
      },
    },
  },
})
