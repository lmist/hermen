import { isPersonaId } from '#/lib/hermen'
import type { Intake, PersonaId } from '#/lib/hermen'

export const MAX_MESSAGES = 40
export const MAX_CHARS = 4000

export interface TextMessage {
  role: 'user' | 'assistant'
  content: string
}

function textOf(m: any): string {
  if (typeof m?.content === 'string') return m.content
  const parts = Array.isArray(m?.parts) ? m.parts : Array.isArray(m?.content) ? m.content : []
  return parts
    .filter((p: any) => p?.type === 'text' && (typeof p.content === 'string' || typeof p.text === 'string'))
    .map((p: any) => (typeof p.content === 'string' ? p.content : p.text))
    .join('')
}

/** Accept UIMessages (role + parts) or {role, content}. Keep user/assistant text only. */
export function normalizeMessages(input: unknown): Array<TextMessage> {
  if (!Array.isArray(input)) return []
  const out: Array<TextMessage> = []
  for (const m of input) {
    if (m?.role !== 'user' && m?.role !== 'assistant') continue
    const content = textOf(m).trim().slice(0, MAX_CHARS)
    if (content) out.push({ role: m.role, content })
  }
  return out.slice(-MAX_MESSAGES)
}

const WANTS = ['vent', 'advice', 'plan', 'heard', 'unsure']

export function parseIntake(raw: unknown): Intake | undefined {
  let v = raw
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v)
    } catch {
      return undefined
    }
  }
  if (!v || typeof v !== 'object') return undefined
  const o = v as Record<string, unknown>
  const intake: Intake = {}
  if (typeof o.sessionWhen === 'string') intake.sessionWhen = o.sessionWhen.slice(0, 300)
  if (typeof o.want === 'string' && WANTS.includes(o.want)) intake.want = o.want as Intake['want']
  if (typeof o.context === 'string') intake.context = o.context.slice(0, 1000)
  return intake
}

export function parsePersona(raw: unknown): PersonaId {
  return isPersonaId(raw) ? raw : 'hermen'
}

/** Read persona and intake from the URL query, then the JSON body (top level or under "data"). */
export function readContext(url: URL, body: any) {
  const data = body && typeof body.data === 'object' && body.data ? body.data : {}
  const pick = (k: string) => url.searchParams.get(k) ?? body?.[k] ?? data[k]
  return { persona: parsePersona(pick('persona')), intake: parseIntake(pick('intake')) }
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Anthropic client config. Keys not scoped to a workspace need ANTHROPIC_WORKSPACE_ID sent as a header. */
export function anthropicConfig() {
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID
  return workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {}
}
