import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { CardView } from '#/components/cards/card-view'
import { SignInButton } from '#/components/auth/sign-in-button'
import { getMe } from '#/server/auth'
import { getCard } from '#/server/cards'

export const Route = createFileRoute('/cards/$id')({
  component: CardPage,
})

function CardPage() {
  const { id } = Route.useParams()
  const me = useQuery({ queryKey: ['me'], queryFn: () => getMe() })
  const saved = useQuery({
    queryKey: ['card', id],
    queryFn: () => getCard({ data: { id } }),
    enabled: me.data?.signedIn === true,
  })

  return (
    <main className="page-wrap px-4 py-12">
      <p className="no-print mb-4">
        <Link to="/cards" className="os-meta underline">
          All saved cards
        </Link>
      </p>
      {me.isPending || saved.isPending && me.data?.signedIn ? (
        <p className="os-meta">Loading…</p>
      ) : !me.data?.signedIn ? (
        <div className="os-tile grid gap-3">
          <p className="m-0">Sign in to see this card.</p>
          <div>
            <SignInButton returnTo={`/cards/${id}`} />
          </div>
        </div>
      ) : saved.data ? (
        <CardView
          persona={saved.data.persona}
          card={saved.data.card}
          createdAt={saved.data.createdAt}
        />
      ) : (
        <p className="os-meta">Card not found.</p>
      )}
    </main>
  )
}
