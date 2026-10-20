import { QueryClient } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

import { deleteCard, listCards, saveCard } from '#/server/cards'
import type { SavedCard } from '#/server/cards'

export type { SavedCard }

/** Own client so the collection does not depend on the router's per-request client. */
export const cardsQueryClient = new QueryClient()

export const cardsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['cards'],
    queryFn: () => listCards(),
    queryClient: cardsQueryClient,
    getKey: (item: SavedCard) => item.id,
    onInsert: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        const { persona, card } = m.modified
        const result = await saveCard({ data: { persona, card } })
        if (!result.ok) throw new Error(result.error)
      }
    },
    onDelete: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        const result = await deleteCard({ data: { id: String(m.key) } })
        if (!result.ok) throw new Error(result.error ?? 'delete_failed')
      }
    },
  }),
)
