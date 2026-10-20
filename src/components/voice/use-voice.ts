import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { PERSONAS } from '#/lib/hermen'
import type { PersonaId } from '#/lib/hermen'
import { getMe } from '#/server/auth'
import { hydrateVoice, requireSignIn, setVoiceEnabled, setVoiceNotice, voiceStore } from '#/lib/store/voice'
import { useMountEffect } from '#/components/hermen/use-mount-effect'
import { VOICE_FAILED, stopVoice, unlockAudio } from './player'

/**
 * Mechanism for the "Voice on / Voice off" pill and the notes under it. Turning voice on unlocks
 * the shared audio element inside the click, then checks getMe (queryKey ['me']): signed out keeps
 * voice off and asks the person to sign in.
 */
export function useVoiceToggle(persona: PersonaId) {
  useMountEffect(hydrateVoice)
  const queryClient = useQueryClient()
  const returnTo = useLocation({ select: (l) => l.href })
  const enabled = useStore(voiceStore, (s) => s.enabled)
  const needsSignIn = useStore(voiceStore, (s) => s.needsSignIn)
  const [checking, setChecking] = useState(false)
  const name = PERSONAS[persona].name

  const turnOn = () => {
    unlockAudio()
    setChecking(true)
    queryClient
      .fetchQuery({ queryKey: ['me'], queryFn: () => getMe(), staleTime: 30_000 })
      .then((me) => (me.signedIn ? setVoiceEnabled(true) : requireSignIn()))
      .catch(() => setVoiceNotice(VOICE_FAILED))
      .finally(() => setChecking(false))
  }

  const turnOff = () => {
    stopVoice()
    setVoiceEnabled(false)
  }

  return {
    enabled,
    checking,
    name,
    label: enabled ? 'Voice on' : 'Voice off',
    showSignIn: needsSignIn && !enabled,
    signInText: `Voice uses Masky. Sign in to hear ${name}.`,
    returnTo,
    privacyText: `Voice is made by Masky: ${name}'s replies are sent to Masky to create the audio. The mic uses your browser's speech recognition.`,
    statusText: checking ? 'Checking sign-in…' : enabled ? `Voice on. ${name} will read replies aloud.` : 'Voice off.',
    toggleProps: {
      type: 'button' as const,
      'aria-pressed': enabled,
      'aria-busy': checking,
      disabled: checking,
      title: enabled ? `Stop reading ${name}'s replies aloud` : `Hear ${name}'s replies in ${PERSONAS[persona].pronoun === 'he' ? 'his' : 'her'} own voice`,
      onClick: enabled ? turnOff : turnOn,
    },
  }
}

/** Mechanism for the slim "{name} is speaking…" bar and voice notices in the chat. */
export function useSpeakingBar() {
  const phase = useStore(voiceStore, (s) => s.phase)
  const speaker = useStore(voiceStore, (s) => s.speaker)
  const notice = useStore(voiceStore, (s) => s.notice)
  const p = speaker ? PERSONAS[speaker] : null

  return {
    visible: phase !== 'idle' && p !== null,
    speaking: phase === 'speaking',
    image: p?.image ?? '',
    label: p ? (phase === 'speaking' ? `${p.name} is speaking…` : `Getting ${p.name}'s voice ready…`) : '',
    notice,
    stopProps: {
      type: 'button' as const,
      'aria-label': p ? `Stop ${p.name} speaking` : 'Stop speaking',
      onClick: stopVoice,
    },
  }
}
