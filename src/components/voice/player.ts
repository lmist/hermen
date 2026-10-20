// Voice playback engine (browser only, no React). One shared HTMLAudioElement, unlocked inside a
// user gesture so later plays work on Safari/iOS. speakReply() splits a reply with splitForSpeech,
// requests one /api/speak clip at a time (chunk i+1 is requested as soon as chunk i's URL arrives,
// so fetching overlaps playback) and plays the clips strictly in order. stop() ends everything.
import { splitForSpeech } from '#/lib/hermen'
import type { PersonaId } from '#/lib/hermen'
import { requireSignIn, setVoiceNotice, setVoicePhase, setVoiceToken, voiceStore } from '#/lib/store/voice'

const SILENT_WAV =
  'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='

export const VOICE_BUSY = 'Voice is busy, try again in a minute'
export const VOICE_FAILED = "Couldn't make the voice this time"
const VOICE_BLOCKED = 'Your browser blocked the audio. Turn voice off and on again to allow it.'

let audio: HTMLAudioElement | null = null
let unlocked = false
/** Bumped by stop(): any fetch or clip from an older generation is ignored. */
let generation = 0
let queue: string[] = []
let fetching = false
let playing = false
let speaker: PersonaId | null = null

function element(): HTMLAudioElement {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'auto'
  audio.addEventListener('ended', () => {
    playing = false
    playNext()
  })
  audio.addEventListener('error', () => {
    if (!playing) return
    playing = false
    playNext()
  })
  return audio
}

/** Call inside a click/keydown handler: plays a silent clip so the element may play later. */
export function unlockAudio() {
  if (typeof window === 'undefined' || unlocked) return
  const el = element()
  if (playing) return
  unlocked = true
  el.src = SILENT_WAV
  el.play()
    .then(() => el.pause())
    .catch(() => {
      unlocked = false
    })
}

function settle() {
  if (!playing && !fetching && queue.length === 0) setVoicePhase('idle')
}

function playNext() {
  if (playing) return
  const url = queue.shift()
  if (!url) {
    settle()
    return
  }
  const el = element()
  const gen = generation
  playing = true
  setVoicePhase('speaking', speaker)
  el.src = url
  el.play().catch(() => {
    if (gen !== generation) return
    playing = false
    queue = []
    fetching = false
    generation++
    setVoiceNotice(VOICE_BLOCKED)
    setVoicePhase('idle')
  })
}

/** Stop playback and drop everything queued or in flight. */
export function stopVoice() {
  generation++
  queue = []
  fetching = false
  playing = false
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  setVoicePhase('idle')
}

type ClipResult = { ok: true; url: string } | { ok: false; status: number }

async function fetchClip(persona: PersonaId, text: string): Promise<ClipResult> {
  try {
    const voiceToken = voiceStore.state.voiceTokens[persona]
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(voiceToken ? { persona, text, voiceToken } : { persona, text }),
    })
    const data = (await res.json().catch(() => ({}))) as { audioUrl?: string; voiceToken?: string }
    if (!res.ok || !data.audioUrl) return { ok: false, status: res.ok ? 502 : res.status }
    if (data.voiceToken) setVoiceToken(persona, data.voiceToken)
    return { ok: true, url: data.audioUrl }
  } catch {
    return { ok: false, status: 502 }
  }
}

function report(status: number) {
  if (status === 401) {
    stopVoice()
    requireSignIn()
    return
  }
  setVoiceNotice(status === 429 ? VOICE_BUSY : VOICE_FAILED)
}

/** Voice a whole reply in the persona's Masky voice. Replaces anything already playing. */
export async function speakReply(persona: PersonaId, text: string) {
  stopVoice()
  const chunks = splitForSpeech(text)
  if (chunks.length === 0) return
  const gen = generation
  speaker = persona
  fetching = true
  setVoiceNotice(null)
  setVoicePhase('loading', persona)
  for (const chunk of chunks) {
    const clip = await fetchClip(persona, chunk)
    if (gen !== generation) return
    if (!clip.ok) {
      report(clip.status)
      break
    }
    queue.push(clip.url)
    playNext()
  }
  if (gen !== generation) return
  fetching = false
  settle()
}
