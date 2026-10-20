// OWNER: auth agent (bead hermen-wgg.6).
import { useQuery } from '@tanstack/react-query'

import { getMe } from '#/server/auth'

export function SignInButton({ returnTo = '/' }: { returnTo?: string }) {
  return (
    <a className="os-pill" href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
      Sign in with Masky
    </a>
  )
}

/** Signed-in Masky avatar + name + sign-out link; signed out, renders SignInButton. */
export function UserBadge() {
  const { data } = useQuery({ queryKey: ['me'], queryFn: () => getMe() })
  if (!data) return null
  if (!data.signedIn) return <SignInButton />
  return (
    <span className="inline-flex items-center gap-2">
      {data.picture ? (
        <img
          src={data.picture}
          alt=""
          width={24}
          height={24}
          className="rounded-full"
          style={{ width: 24, height: 24 }}
        />
      ) : null}
      <span>{data.name}</span>
      <a className="os-pill" href="/auth/logout">
        Sign out
      </a>
    </span>
  )
}
