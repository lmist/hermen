import { useRef, useState, useSyncExternalStore } from 'react'

// Minimal Web Speech API types (not in lib.dom for every TS target).
interface SpeechAlternative {
  transcript: string
}
interface SpeechResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechAlternative
}
interface SpeechResultEvent {
  readonly results: { readonly length: number; [index: number]: SpeechResult }
}
interface SpeechErrorEvent {
  readonly error: string
}
interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechResultEvent) => void) | null
  onerror: ((e: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const noSubscribe = () => () => {}

export interface SpeechInputOptions {
  /** Called inside the tap, before listening starts. */
  onStart: () => void
  /** Live transcript (final + interim so far). */
  onTranscript: (text: string) => void
  /** Recognition ended with a final transcript. */
  onFinal: (text: string) => void
  /** Cancelled, or ended with nothing heard. */
  onCancel: () => void
}

function errorText(code: string): string | null {
  if (code === 'aborted' || code === 'no-speech') return null
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'The microphone is blocked. Allow it in your browser to talk.'
  return "Couldn't hear that. Try again, or type instead."
}

/**
 * Mechanism for the mic pill: the browser's speech recognition (lang = navigator.language,
 * interim results on). Tap to listen, tap again to cancel. Hidden when unsupported.
 */
export function useSpeechInput(options: SpeechInputOptions, disabled: boolean) {
  const supported = useSyncExternalStore(noSubscribe, () => recognitionCtor() !== null, () => false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  const cancelledRef = useRef(false)
  const finalRef = useRef('')
  const optionsRef = useRef(options)
  optionsRef.current = options

  const start = () => {
    const Ctor = recognitionCtor()
    if (!Ctor) return
    optionsRef.current.onStart()
    const rec = new Ctor()
    rec.lang = navigator.language
    rec.interimResults = true
    rec.continuous = false
    cancelledRef.current = false
    finalRef.current = ''
    rec.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      finalRef.current = final.trim()
      optionsRef.current.onTranscript(`${final}${interim}`.trim())
    }
    rec.onerror = (e) => setError(errorText(e.error))
    rec.onend = () => {
      recognitionRef.current = null
      setListening(false)
      const text = finalRef.current
      if (!cancelledRef.current && text) optionsRef.current.onFinal(text)
      else optionsRef.current.onCancel()
    }
    recognitionRef.current = rec
    setError(null)
    try {
      rec.start()
      setListening(true)
    } catch {
      recognitionRef.current = null
      setError("Couldn't start the microphone. Try again, or type instead.")
    }
  }

  const cancel = () => {
    cancelledRef.current = true
    recognitionRef.current?.abort()
  }

  return {
    supported,
    listening,
    error,
    statusText: listening ? 'Listening. Speak now, or tap the mic again to cancel.' : '',
    micProps: {
      type: 'button' as const,
      'aria-pressed': listening,
      title: listening ? 'Cancel listening' : 'Talk instead of typing',
      disabled: disabled && !listening,
      onClick: listening ? cancel : start,
    },
  }
}
