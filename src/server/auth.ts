// OWNER: auth agent (bead hermen-wgg.6). Stub; keep the export names and the Me shape.
import { createServerFn } from '@tanstack/react-start'

import { authMode } from '#/lib/session'
import type { AuthMode } from '#/lib/session'

export interface Me {
  authMode: AuthMode
  signedIn: boolean
  name?: string
  picture?: string | null
}

export const getMe = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Me> => ({ authMode: authMode(), signedIn: false }),
)
