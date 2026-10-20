// OWNER: auth agent (bead hermen-wgg.6). Stub until Login with Masky lands; keep these exports.
export interface Session {
  /** Stable Masky pseudonym for (user, app, avatar). Use it as the account id. */
  sub: string
  name: string
  picture: string | null
}

export type AuthMode = 'masky' | 'open'

export function authMode(): AuthMode {
  return process.env.AUTH_MODE === 'masky' ? 'masky' : 'open'
}

/** Read and verify the signed `hermen_session` cookie. Returns null when signed out. */
export async function getSession(_request: Request): Promise<Session | null> {
  return null
}

/** Same as getSession, for use inside createServerFn handlers (reads the current request). */
export async function getRequestSession(): Promise<Session | null> {
  return null
}
