import { createServerFn } from '@tanstack/react-start'

import { withDb } from '#/db'
import { cardTitle, isPersonaId, prepCardSchema } from '#/lib/hermen'
import type { PersonaId, PrepCard } from '#/lib/hermen'
import { getRequestSession } from '#/lib/session'

export interface SavedCard {
  id: string
  persona: PersonaId
  title: string
  card: PrepCard
  createdAt: string
}

export type SaveResult =
  | { ok: true; card: SavedCard }
  | { ok: false; error: string }

const SIGNED_OUT = 'signed_out'

function toSaved(row: {
  id: string
  persona: string
  title: string
  card: unknown
  createdAt: Date
}): SavedCard {
  return {
    id: row.id,
    persona: isPersonaId(row.persona) ? row.persona : 'hermen',
    title: row.title,
    card: row.card as PrepCard,
    createdAt: row.createdAt.toISOString(),
  }
}

/** The signed-in user's cards, newest first. Signed out: an empty list. */
export const listCards = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<SavedCard>> => {
    const session = await getRequestSession()
    if (!session) return []
    const rows = await withDb((db) =>
      db.card.findMany({
        where: { sub: session.sub },
        orderBy: { createdAt: 'desc' },
      }),
    )
    return rows.map(toSaved)
  },
)

export const saveCard = createServerFn({ method: 'POST' })
  .validator((data: { persona: string; card: unknown }) => data)
  .handler(async ({ data }): Promise<SaveResult> => {
    const session = await getRequestSession()
    if (!session) return { ok: false, error: SIGNED_OUT }
    if (!isPersonaId(data.persona)) return { ok: false, error: 'bad_persona' }
    const parsed = prepCardSchema.safeParse(data.card)
    if (!parsed.success) return { ok: false, error: 'bad_card' }
    const row = await withDb((db) =>
      db.card.create({
        data: {
          sub: session.sub,
          persona: data.persona,
          title: cardTitle(parsed.data),
          card: parsed.data,
        },
      }),
    )
    return { ok: true, card: toSaved(row) }
  })

/** One saved card, only if the signed-in user owns it. */
export const getCard = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<SavedCard | null> => {
    const session = await getRequestSession()
    if (!session) return null
    const row = await withDb((db) =>
      db.card.findFirst({ where: { id: data.id, sub: session.sub } }),
    )
    return row ? toSaved(row) : null
  })

export const deleteCard = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const session = await getRequestSession()
    if (!session) return { ok: false, error: SIGNED_OUT }
    await withDb((db) =>
      db.card.deleteMany({ where: { id: data.id, sub: session.sub } }),
    )
    return { ok: true }
  })
