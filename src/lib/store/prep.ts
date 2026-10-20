// Prep session state (browser only, never persisted): persona, intake, latest card, crisis flag.
// Read it with useStore(prepStore, selector) from @tanstack/react-store.
import { createStore } from '@tanstack/store'
import type { Intake, PersonaId, PrepCard } from '#/lib/hermen'

export interface PrepState {
  persona: PersonaId | null
  intake: Intake | null
  card: PrepCard | null
  crisis: boolean
}

const initialState: PrepState = { persona: null, intake: null, card: null, crisis: false }

export const prepStore = createStore<PrepState>(initialState)

/** Start a fresh prep with this persona and these intake answers. */
export function startPrep(persona: PersonaId, intake: Intake) {
  prepStore.setState(() => ({ ...initialState, persona, intake }))
}

export function setCard(card: PrepCard) {
  prepStore.setState((prev) => ({ ...prev, card }))
}

/** Once raised, the crisis flag stays up for the rest of the tab session. */
export function flagCrisis() {
  prepStore.setState((prev) => (prev.crisis ? prev : { ...prev, crisis: true }))
}

export function resetPrep() {
  prepStore.setState(() => initialState)
}
