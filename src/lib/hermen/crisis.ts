// Crisis guard. Hard-coded on purpose: the model never decides whether to show crisis lines.
// Run it in the browser (show the panel at once) and on the server (add the safety rule).

const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid/i,
  /\bkill(ing)?\s+my\s*self\b/i,
  /\bend\s+(it\s+all|my\s+life)\b/i,
  /\b(want|wanna|going|plan(ning)?)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+(here|alive)|wake\s+up)\b/i,
  /\b(better\s+off\s+dead|no\s+reason\s+to\s+live)\b/i,
  /\bself[-\s]?harm/i,
  /\b(hurt|hurting|cut|cutting|harm|harming)\s+my\s*self\b/i,
  /\boverdos/i,
  /\b(hits?|beats?|chokes?)\s+me\b/i,
  /\b(i'?m|i\s+am|i\s+feel)\s+(not\s+safe|unsafe|in\s+danger)\b/i,
]

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text))
}

export interface CrisisResource {
  label: string
  detail: string
  href?: string
}

export const CRISIS_RESOURCES: readonly CrisisResource[] = [
  { label: 'US: call or text 988', detail: 'Suicide & Crisis Lifeline, 24/7', href: 'tel:988' },
  { label: 'UK & Ireland: call 116 123', detail: 'Samaritans, 24/7, free', href: 'tel:116123' },
  {
    label: 'Anywhere: findahelpline.com',
    detail: 'Free, confidential helplines in your country',
    href: 'https://findahelpline.com',
  },
  { label: 'In immediate danger', detail: 'Call your local emergency number now.' },
]

export const CRISIS_MESSAGE =
  'What you wrote sounds serious, and it matters more than any prep. Please reach out to someone who can help right now:'

export const NOT_A_THERAPIST = 'Hermen is not a therapist and is not for emergencies.'
