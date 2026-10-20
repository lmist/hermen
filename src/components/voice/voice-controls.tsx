import { Mic, MicOff, Square, Volume2, VolumeX } from 'lucide-react'
import type { PersonaId } from '#/lib/hermen'
import { SignInButton } from '#/components/auth/sign-in-button'
import { useSpeakingBar, useVoiceToggle } from './use-voice'
import type { useSpeechInput } from './use-speech-input'

const focus = 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** Header pill plus the notes under it (sign-in prompt, privacy copy). */
export function VoiceToggle({ persona }: { persona: PersonaId }) {
  const voice = useVoiceToggle(persona)
  const Icon = voice.enabled ? Volume2 : VolumeX
  return (
    <button
      {...voice.toggleProps}
      className={`os-pill inline-flex items-center gap-1.5 text-[12px] disabled:opacity-60 ${voice.enabled ? 'os-pill-solid' : ''} ${focus}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {voice.label}
    </button>
  )
}

export function VoiceNotes({ persona }: { persona: PersonaId }) {
  const voice = useVoiceToggle(persona)
  return (
    <div aria-live="polite" className="grid gap-2 print:hidden">
      <span className="sr-only">{voice.statusText}</span>
      {voice.showSignIn ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border p-3">
          <p className="m-0 text-[14px]">{voice.signInText}</p>
          <SignInButton returnTo={voice.returnTo} />
        </div>
      ) : null}
      {voice.enabled ? <p className="os-meta m-0">{voice.privacyText}</p> : null}
    </div>
  )
}

/** Slim bar while a reply is being voiced, plus any voice notice. */
export function SpeakingBar() {
  const bar = useSpeakingBar()
  return (
    <div role="status" aria-live="polite" className="sticky bottom-3 z-10 grid gap-2 empty:hidden">
      {bar.visible ? (
        <div className="flex items-center gap-3 rounded-full border border-border bg-card py-1.5 pr-1.5 pl-2">
          <img
            src={bar.image}
            alt=""
            width={24}
            height={24}
            className={`size-6 shrink-0 rounded-full border border-border object-cover ${bar.speaking ? '' : 'opacity-60 motion-safe:animate-pulse'}`}
          />
          <span className="min-w-0 flex-1 truncate text-[13px]">{bar.label}</span>
          <button {...bar.stopProps} className={`os-pill inline-flex items-center gap-1.5 text-[12px] ${focus}`}>
            <Square aria-hidden="true" className="size-3" />
            Stop
          </button>
        </div>
      ) : null}
      {bar.notice ? <p className="os-meta m-0">{bar.notice}</p> : null}
    </div>
  )
}

/** Mic pill next to Send. Renders nothing when the browser has no speech recognition. */
export function MicButton({ mic }: { mic: ReturnType<typeof useSpeechInput> }) {
  if (!mic.supported) return null
  const Icon = mic.listening ? MicOff : Mic
  return (
    <button
      {...mic.micProps}
      className={`os-pill inline-flex items-center gap-1.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${mic.listening ? 'os-pill-solid' : ''} ${focus}`}
    >
      <Icon aria-hidden="true" className={`size-3.5 ${mic.listening ? 'motion-safe:animate-pulse' : ''}`} />
      {mic.listening ? 'Listening… tap to cancel' : 'Talk'}
    </button>
  )
}
