import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { SignInButton } from '#/components/auth/sign-in-button'
import type { PersonaId, PrepCard } from '#/lib/hermen'
import { cardsCollection } from '#/lib/cards-collection'
import { getMe } from '#/server/auth'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/** Mechanism: who is signed in, and the optimistic insert. */
function useSaveCard(persona: PersonaId, card: PrepCard) {
  const me = useQuery({ queryKey: ['me'], queryFn: () => getMe() })
  const [state, setState] = useState<SaveState>('idle')

  const save = async () => {
    setState('saving')
    try {
      const tx = cardsCollection.insert({
        id: crypto.randomUUID(),
        persona,
        title: card.understand.slice(0, 80),
        card,
        createdAt: new Date().toISOString(),
      })
      await tx.isPersisted.promise
      setState('saved')
    } catch {
      setState('error')
    }
  }

  return { me: me.data, loading: me.isPending, state, save }
}

export function SaveCardButton({
  persona,
  card,
}: {
  persona: PersonaId
  card: PrepCard
}) {
  const { me, loading, state, save } = useSaveCard(persona, card)
  const path = useLocation({ select: (l) => l.pathname })

  if (loading) {
    return (
      <span className="os-pill" aria-busy="true">
        Save card
      </span>
    )
  }

  if (!me?.signedIn) {
    return (
      <span className="inline-flex items-center gap-3">
        <span className="os-meta">Sign in to save</span>
        <SignInButton returnTo={path} />
      </span>
    )
  }

  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-3">
        <span className="os-pill">Saved</span>
        <Link to="/cards" className="os-meta underline">
          View saved cards
        </Link>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        className="os-pill os-pill-solid"
        disabled={state === 'saving'}
        onClick={save}
      >
        {state === 'saving' ? 'Saving…' : 'Save card'}
      </button>
      {state === 'error' && (
        <span className="os-meta">Could not save. Try again.</span>
      )}
    </span>
  )
}
