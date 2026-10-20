// Masky avatar ids for the guides' voices (server use). Generated from public/avatars.json.
import type { PersonaId } from './personas'

export interface MaskyVoice {
  avatarId: string
  avatarOwnerUserId: string
}

export const MASKY_VOICES: Record<PersonaId, MaskyVoice> = {
  hermen: { avatarId: '9De1RcNsQcDxwrDNuh2r', avatarOwnerUserId: 'RqOkbuj2QgOPHPTHnCu4qCRfGyP2' },
  herma: { avatarId: 'MtDW296iexHn2H8FVLwV', avatarOwnerUserId: 'RqOkbuj2QgOPHPTHnCu4qCRfGyP2' },
}
