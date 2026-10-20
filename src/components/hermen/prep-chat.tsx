import type { Intake, PersonaId } from '#/lib/hermen'
import { NOT_A_THERAPIST } from '#/lib/hermen'
import { CrisisPanel } from './crisis-lines'
import { PrepCardView } from './prep-card'
import { useComposer, usePrepChat } from './use-prep-chat'
import type { ChatBubble } from './use-prep-chat'

const focus = 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

export function PrepChat({ persona, intake }: { persona: PersonaId; intake: Intake }) {
  const chat = usePrepChat(persona, intake)
  const composer = useComposer(chat.send, chat.busy)

  return (
    <div className="grid gap-10">
      <section aria-label={`Conversation with ${chat.persona.name}`} className="grid gap-4 print:hidden">
        <ol
          role="log"
          aria-live="polite"
          aria-busy={chat.busy}
          aria-label="Messages"
          className="m-0 grid list-none gap-3 p-0"
        >
          {chat.bubbles.map((b) => (
            <Bubble key={b.id} bubble={b} name={chat.persona.name} image={chat.persona.image} />
          ))}
          {chat.waiting ? (
            <li className="os-meta pl-11" aria-label={`${chat.persona.name} is writing`}>
              {chat.persona.name} is listening…
            </li>
          ) : null}
        </ol>

        {chat.chatError ? (
          <p role="alert" className="m-0 rounded-[14px] border border-destructive p-3 text-[14px]">
            Something went wrong: {chat.chatError}
          </p>
        ) : null}

        {chat.crisis ? <CrisisPanel /> : null}

        <form {...composer.formProps} className="grid gap-3">
          <label htmlFor="composer" className="sr-only">
            Message {chat.persona.name}
          </label>
          <textarea
            id="composer"
            {...composer.textareaProps}
            rows={3}
            placeholder="Say it messy. However it comes out is fine."
            aria-describedby="composer-hint"
            className={`w-full resize-y rounded-[14px] border border-border bg-card p-3 text-[16px] text-foreground placeholder:text-muted-foreground ${focus}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            {chat.busy ? (
              <button type="button" onClick={chat.stop} className={`os-pill text-[13px] ${focus}`}>
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!composer.canSend}
                className={`os-pill os-pill-solid text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
              >
                Send
              </button>
            )}
            <button
              {...chat.threeWaysProps}
              className={`os-pill text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
            >
              Say it three ways
            </button>
            <button {...chat.cardProps} className={`os-pill text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}>
              {chat.cardLabel}
            </button>
            <span id="composer-hint" className="os-meta ml-auto hidden sm:inline">
              Enter sends · Shift+Enter new line
            </span>
          </div>
          {chat.cardError ? (
            <p role="alert" className="m-0 text-[14px] text-destructive">
              {chat.cardError}
            </p>
          ) : null}
          <p className="os-meta m-0">{NOT_A_THERAPIST} Your conversation lives only in this tab.</p>
        </form>
      </section>

      <div ref={chat.cardRef} className="scroll-mt-4">
        {chat.card ? <PrepCardView persona={persona} card={chat.card} /> : null}
      </div>
    </div>
  )
}

function Bubble({ bubble, name, image }: { bubble: ChatBubble; name: string; image: string }) {
  if (bubble.role === 'user') {
    return (
      <li className="ml-auto max-w-[85%] rounded-[14px] bg-secondary px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">
        <span className="sr-only">You: </span>
        {bubble.text}
      </li>
    )
  }
  return (
    <li className="flex max-w-[92%] items-start gap-3">
      <img src={image} alt="" width={32} height={32} className="mt-1 size-8 shrink-0 rounded-full border border-border object-cover" />
      <div className="rounded-[14px] border border-border px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">
        <span className="sr-only">{name}: </span>
        {bubble.text || <span className="os-meta">…</span>}
      </div>
    </li>
  )
}
