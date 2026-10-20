import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai-react'
import { PERSONAS, THREE_WAYS_REQUEST, detectCrisis } from '#/lib/hermen'
import type { Intake, PersonaId, PrepCard } from '#/lib/hermen'
import { flagCrisis, prepStore, setCard } from '#/lib/store/prep'
import { voiceStore } from '#/lib/store/voice'
import { speakReply, stopVoice, unlockAudio } from '#/components/voice/player'
import { useSpeechInput } from '#/components/voice/use-speech-input'

export interface ChatBubble {
  id: string
  role: 'user' | 'assistant'
  text: string
}

function bubbleText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.content : ''))
    .join('')
    .trim()
}

function chatUrl(persona: PersonaId, intake: Intake) {
  const params = new URLSearchParams({ persona, intake: JSON.stringify(intake) })
  return `/api/chat?${params.toString()}`
}

async function postCard(body: { messages: ReadonlyArray<UIMessage>; persona: PersonaId; intake: Intake }) {
  const res = await fetch('/api/card', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { card?: PrepCard; error?: string }
  if (!res.ok || !data.card) throw new Error(data.error ?? `The card did not come through (${res.status}).`)
  return data.card
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Mechanism for the prep chat: streaming via useChat, crisis check on every user message
 * (in the browser, before anything is sent), "Say it three ways", and "Make my prep card".
 */
export function usePrepChat(persona: PersonaId, intake: Intake) {
  const p = PERSONAS[persona]
  /** Set when the person presses Stop, so a cut-off reply is not read aloud. */
  const stoppedRef = useRef(false)
  const chat = useChat({
    connection: fetchServerSentEvents(chatUrl(persona, intake)),
    body: { persona, intake },
    onFinish: (message) => {
      if (stoppedRef.current || message.role !== 'assistant' || !voiceStore.state.enabled) return
      void speakReply(persona, bubbleText(message))
    },
  })
  const crisis = useStore(prepStore, (s) => s.crisis)
  const card = useStore(prepStore, (s) => s.card)
  const cardRef = useRef<HTMLDivElement>(null)

  const cardMutation = useMutation({
    mutationFn: postCard,
    onSuccess: (next) => {
      setCard(next)
      requestAnimationFrame(() =>
        cardRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }),
      )
    },
  })

  const busy = chat.status === 'submitted' || chat.status === 'streaming'

  const send = (text: string) => {
    const content = text.trim()
    if (!content) return
    stopVoice()
    if (voiceStore.state.enabled) unlockAudio()
    stoppedRef.current = false
    if (detectCrisis(content)) flagCrisis()
    void chat.sendMessage(content)
  }

  const intro: ChatBubble = { id: 'intro', role: 'assistant', text: p.intro }
  const bubbles: ChatBubble[] = [
    intro,
    ...chat.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ id: m.id, role: m.role as ChatBubble['role'], text: bubbleText(m) })),
  ]
  const last = bubbles[bubbles.length - 1]
  const waiting = busy && last.role === 'user'
  const userTurns = chat.messages.filter((m) => m.role === 'user').length

  return {
    persona: p,
    bubbles,
    busy,
    waiting,
    crisis,
    card,
    cardRef,
    chatError: chat.error?.message ?? null,
    send,
    stop: () => {
      stoppedRef.current = true
      chat.stop()
    },
    threeWaysProps: {
      type: 'button' as const,
      disabled: busy || userTurns === 0,
      onClick: () => send(THREE_WAYS_REQUEST),
    },
    cardProps: {
      type: 'button' as const,
      disabled: busy || userTurns === 0 || cardMutation.isPending,
      'aria-busy': cardMutation.isPending,
      onClick: () => cardMutation.mutate({ messages: chat.messages, persona, intake }),
    },
    cardLabel: cardMutation.isPending ? 'Writing your card…' : card ? 'Remake my prep card' : 'Make my prep card',
    cardError: cardMutation.error?.message ?? null,
  }
}

/**
 * Mechanism for the composer: Enter sends, Shift+Enter adds a newline. The mic (when the browser
 * has speech recognition) shows the live transcript in the textarea and sends the final one
 * like a typed message; starting it stops any voice playback.
 */
export function useComposer(onSend: (text: string) => void, disabled: boolean) {
  const [value, setValue] = useState('')
  const draftRef = useRef('')
  const join = (spoken: string) => [draftRef.current.trim(), spoken].filter(Boolean).join(' ')
  const mic = useSpeechInput(
    {
      onStart: () => {
        stopVoice()
        unlockAudio()
        draftRef.current = value
      },
      onTranscript: (text) => setValue(join(text)),
      onFinal: (text) => {
        onSend(join(text))
        draftRef.current = ''
        setValue('')
      },
      onCancel: () => setValue(draftRef.current),
    },
    disabled,
  )
  const canSend = !disabled && !mic.listening && value.trim().length > 0

  const submit = () => {
    if (!canSend) return
    onSend(value)
    setValue('')
  }

  return {
    canSend,
    mic,
    formProps: {
      onSubmit: (e: React.FormEvent) => {
        e.preventDefault()
        submit()
      },
    },
    textareaProps: {
      value,
      readOnly: mic.listening,
      'aria-busy': mic.listening,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value),
      onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault()
          submit()
        }
      },
    },
  }
}
