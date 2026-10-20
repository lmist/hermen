// The prep card: one page the person brings to their therapy session.
// The model fills prepCardSchema (TanStack AI structured output); the UI renders CARD_LABELS.
import { z } from 'zod'

export const prepCardSchema = z.object({
  understand: z
    .string()
    .describe('First person, 1-2 sentences: what I most want my therapist to understand.'),
  threeWays: z
    .array(z.string())
    .describe('Three first-person versions of the hardest thing: plain, gentle, with an example.'),
  misread: z
    .array(z.object({ phrase: z.string(), meaning: z.string() }))
    .describe('Up to 4 phrases I used that could be misread, each with what I actually mean.'),
  want: z.string().describe('What I want from this session: vent, advice, a plan, or to be heard.'),
  checkBack: z
    .string()
    .describe('One question I can ask my therapist to check I was understood.'),
})

export type PrepCard = z.infer<typeof prepCardSchema>

export const CARD_LABELS: Record<keyof PrepCard, string> = {
  understand: 'What I most want you to understand',
  threeWays: 'The hardest thing, three ways',
  misread: 'Words I use that might be misread',
  want: 'What I want from this session',
  checkBack: 'Check-back question',
}

export const THREE_WAYS_LABELS = ['Plain', 'Gentle', 'With an example'] as const

export function cardTitle(card: PrepCard): string {
  const text = card.understand.trim()
  if (!text) return 'My prep card'
  return text.length > 80 ? `${text.slice(0, 77)}…` : text
}

export function cardToMarkdown(card: PrepCard): string {
  const lines: string[] = [`## ${CARD_LABELS.understand}`, card.understand, '']
  lines.push(`## ${CARD_LABELS.threeWays}`)
  card.threeWays.forEach((version, i) => lines.push(`- **${THREE_WAYS_LABELS[i] ?? `Version ${i + 1}`}:** ${version}`))
  lines.push('', `## ${CARD_LABELS.misread}`)
  card.misread.forEach(({ phrase, meaning }) => lines.push(`- "${phrase}" → ${meaning}`))
  lines.push('', `## ${CARD_LABELS.want}`, card.want, '', `## ${CARD_LABELS.checkBack}`, card.checkBack)
  return lines.join('\n')
}
