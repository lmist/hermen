// Voice mode state (browser only). `enabled` is persisted to localStorage; everything else
// lives in memory for this tab: the playback phase, the last notice, the sign-in prompt, and
// one Masky voiceToken per persona (so a single Masky conversation is reused).
// Read it with useStore(voiceStore, selector) from @tanstack/react-store.
import { createStore } from '@tanstack/store'
import type { PersonaId } from '#/lib/hermen'

export type VoicePhase = 'idle' | 'loading' | 'speaking'

export interface VoiceState {
  enabled: boolean
  /** Voice was asked for while signed out: show the sign-in note. */
  needsSignIn: boolean
  phase: VoicePhase
  /** Persona whose reply is being voiced. */
  speaker: PersonaId | null
  /** Last voice problem, shown inline (never blocks the text reply). */
  notice: string | null
  voiceTokens: Partial<Record<PersonaId, string>>
}

const STORAGE_KEY = 'hermen.voice'

export const voiceStore = createStore<VoiceState>({
  enabled: false,
  needsSignIn: false,
  phase: 'idle',
  speaker: null,
  notice: null,
  voiceTokens: {},
})

function persist(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // Private mode or storage disabled: voice still works for this tab.
  }
}

/** Read the stored choice into the store (call once on mount, in the browser). */
export function hydrateVoice() {
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    stored = null
  }
  const enabled = stored === 'on'
  voiceStore.setState((prev) => (prev.enabled === enabled ? prev : { ...prev, enabled }))
}

export function setVoiceEnabled(enabled: boolean) {
  persist(enabled)
  voiceStore.setState((prev) => ({ ...prev, enabled, needsSignIn: false, notice: null }))
}

/** Signed out: keep voice off and ask the person to sign in. */
export function requireSignIn() {
  persist(false)
  voiceStore.setState((prev) => ({ ...prev, enabled: false, needsSignIn: true, phase: 'idle', speaker: null }))
}

export function setVoicePhase(phase: VoicePhase, speaker: PersonaId | null = null) {
  voiceStore.setState((prev) =>
    prev.phase === phase && prev.speaker === speaker ? prev : { ...prev, phase, speaker: phase === 'idle' ? null : speaker },
  )
}

export function setVoiceNotice(notice: string | null) {
  voiceStore.setState((prev) => (prev.notice === notice ? prev : { ...prev, notice }))
}

export function setVoiceToken(persona: PersonaId, token: string) {
  voiceStore.setState((prev) => ({ ...prev, voiceTokens: { ...prev.voiceTokens, [persona]: token } }))
}
