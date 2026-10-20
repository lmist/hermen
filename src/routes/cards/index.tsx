import { ClientOnly, Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'

import { SignInButton } from '#/components/auth/sign-in-button'
import { PERSONAS } from '#/lib/hermen'
import { cardsCollection } from '#/lib/cards-collection'
import { getMe } from '#/server/auth'

export const Route = createFileRoute('/cards/')({
  component: CardsPage,
})

function CardsPage() {
  return (
    <main className="page-wrap px-4 py-12">
      <p className="os-kicker">Saved</p>
      <h1 className="mb-6 text-4xl">Your prep cards</h1>
      <ClientOnly fallback={<p className="os-meta">Loading…</p>}>
        <CardsGate />
      </ClientOnly>
    </main>
  )
}

function CardsGate() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => getMe() })
  if (me.isPending) return <p className="os-meta">Loading…</p>
  if (!me.data?.signedIn) {
    return (
      <div className="os-tile grid gap-3">
        <p className="m-0">Sign in to see the cards you saved.</p>
        <div>
          <SignInButton returnTo="/cards" />
        </div>
      </div>
    )
  }
  return <CardList />
}

function CardList() {
  const { data, isLoading } = useLiveQuery((q) =>
    q
      .from({ c: cardsCollection })
      .orderBy(({ c }) => c.createdAt, 'desc'),
  )

  if (isLoading) return <p className="os-meta">Loading…</p>
  if (data.length === 0) {
    return (
      <div className="os-tile grid gap-3">
        <p className="m-0">No saved cards yet. Talk with Hermen or Herma, then save your card.</p>
        <div>
          <Link to="/" className="os-pill">
            Start
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ul className="grid gap-3 p-0">
      {data.map((c) => (
        <li key={c.id} className="os-tile flex items-center justify-between gap-4 list-none">
          <Link to="/cards/$id" params={{ id: c.id }} className="grid gap-1 no-underline">
            <span>{c.title}</span>
            <span className="os-meta">
              {PERSONAS[c.persona].name} · {new Date(c.createdAt).toLocaleDateString()}
            </span>
          </Link>
          <button
            type="button"
            className="os-pill"
            onClick={() => cardsCollection.delete(c.id)}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
