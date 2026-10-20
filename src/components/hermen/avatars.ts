import { queryOptions, useQuery } from '@tanstack/react-query'
import type { PersonaId } from '#/lib/hermen'

export interface AvatarInfo {
  name: string
  avatarId: string
  imageUrl: string
  introLiveUrl: string
}

export type AvatarMap = Record<PersonaId, AvatarInfo>

export const avatarsQuery = queryOptions({
  queryKey: ['avatars'],
  queryFn: async (): Promise<AvatarMap> => {
    const res = await fetch('/avatars.json')
    if (!res.ok) throw new Error(`avatars.json: ${res.status}`)
    return res.json()
  },
  staleTime: Infinity,
})

export function useAvatar(persona: PersonaId) {
  return useQuery({ ...avatarsQuery, select: (all) => all[persona] })
}
