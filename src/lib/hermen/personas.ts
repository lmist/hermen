// Hermen and Herma: same brain, same rules, different face and voice.
// Owner: orchestrator. Import from '#/lib/hermen'.

export type PersonaId = 'hermen' | 'herma'

export interface Persona {
  id: PersonaId
  name: string
  pronoun: 'he' | 'she'
  /** One line under the name on the persona card. */
  tagline: string
  /** What the intro video says. Also the first message in the chat. */
  intro: string
  /** Where the name comes from. */
  nameMeaning: string
  /** Portrait served from public/. */
  image: string
}

export const PERSONAS: Record<PersonaId, Persona> = {
  hermen: {
    id: 'hermen',
    name: 'Hermen',
    pronoun: 'he',
    tagline: 'Calm, unhurried, listens closely.',
    intro:
      "Hi, I'm Hermen. Before your next session, let's find the words together. Messy is fine. Then we'll check that what you say is what you mean.",
    nameMeaning: 'From Hermes and hermeneutics: the messenger, the interpreter.',
    image: '/avatars/hermen.jpg',
  },
  herma: {
    id: 'herma',
    name: 'Herma',
    pronoun: 'she',
    tagline: 'Warm, clear, patient.',
    intro:
      "Hi, I'm Herma. Therapy goes better when you've already found some of the words. Let's practice, so you walk in ready to be understood.",
    nameMeaning:
      'A herma was a stone marker at Greek crossroads and doorways, a guardian of thresholds.',
    image: '/avatars/herma.jpg',
  },
}

export const PERSONA_IDS: readonly PersonaId[] = ['hermen', 'herma']

export function isPersonaId(value: unknown): value is PersonaId {
  return value === 'hermen' || value === 'herma'
}
