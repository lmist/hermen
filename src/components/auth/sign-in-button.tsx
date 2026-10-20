// OWNER: auth agent (bead hermen-wgg.6). Stub; keep the export names and props.
export function SignInButton({ returnTo = '/' }: { returnTo?: string }) {
  return (
    <a className="os-pill" href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
      Sign in with Masky
    </a>
  )
}

/** Shows the signed-in Masky avatar (name + picture) with a sign-out link. Renders nothing when signed out. */
export function UserBadge() {
  return null
}
