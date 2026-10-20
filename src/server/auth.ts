// OWNER: auth agent (bead hermen-wgg.6).
import { createServerFn } from '@tanstack/react-start'

import { authMode, getRequestSession } from '#/lib/session'
import type { AuthMode } from '#/lib/session'

export interface Me {
  authMode: AuthMode
  signedIn: boolean
  name?: string
  picture?: string | null
}

export const getMe = createServerFn({ method: 'GET' }).handler(async (): Promise<Me> => {
  const session = await getRequestSession()
  if (!session) return { authMode: authMode(), signedIn: false }
  return { authMode: authMode(), signedIn: true, name: session.name, picture: session.picture }
})
