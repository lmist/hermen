import { useState } from 'react'
import { SaveCardButton } from '#/components/cards/save-card-button'
import { CARD_LABELS, PERSONAS, THREE_WAYS_LABELS, cardToMarkdown } from '#/lib/hermen'
import type { PersonaId, PrepCard } from '#/lib/hermen'

const focus = 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

type CopyState = 'idle' | 'copied' | 'failed'

/** Mechanism: copy as Markdown, print (print CSS hides everything but the card). */
export function usePrepCardActions(card: PrepCard) {
  const [copy, setCopy] = useState<CopyState>('idle')

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(cardToMarkdown(card))
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  return {
    copyLabel: copy === 'copied' ? 'Copied' : 'Copy',
    copyStatus: copy === 'copied' ? 'Card copied as text.' : copy === 'failed' ? 'Copy did not work. Select the text instead.' : '',
    copyProps: { type: 'button' as const, onClick: onCopy },
    printProps: { type: 'button' as const, onClick: () => window.print() },
  }
}

export function PrepCardView({ persona, card }: { persona: PersonaId; card: PrepCard }) {
  const actions = usePrepCardActions(card)

  return (
    <article
      aria-labelledby="prep-card-title"
      className="prep-card os-card grid gap-6 border border-border p-6 sm:p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-[#111111] print:shadow-none"
    >
      <header className="grid gap-1">
        <p className="os-kicker m-0 print:text-[#111111]">Prep card · with {PERSONAS[persona].name}</p>
        <h2 id="prep-card-title" className="m-0 text-[clamp(24px,3vw,32px)]">
          My prep card
        </h2>
      </header>

      <Section label={CARD_LABELS.understand}>
        <p className="m-0 text-[17px] leading-relaxed">{card.understand}</p>
      </Section>

      <Section label={CARD_LABELS.threeWays}>
        <ol className="m-0 grid list-none gap-3 p-0">
          {card.threeWays.map((version, i) => (
            <li key={i} className="grid gap-0.5">
              <span className="os-meta print:text-[#111111]">{THREE_WAYS_LABELS[i] ?? `Version ${i + 1}`}</span>
              <span className="text-[15px] leading-relaxed">{version}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section label={CARD_LABELS.misread}>
        {card.misread.length ? (
          <ul className="m-0 grid list-none gap-3 p-0">
            {card.misread.map(({ phrase, meaning }, i) => (
              <li key={i} className="grid gap-0.5">
                <span className="text-[15px]">"{phrase}"</span>
                <span className="text-[14px] text-muted-foreground print:text-[#111111]">I mean: {meaning}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-[14px] text-muted-foreground">(we didn't get to this)</p>
        )}
      </Section>

      <Section label={CARD_LABELS.want}>
        <p className="m-0 text-[15px]">{card.want}</p>
      </Section>

      <Section label={CARD_LABELS.checkBack}>
        <p className="m-0 text-[15px]">{card.checkBack}</p>
      </Section>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button {...actions.copyProps} className={`os-pill text-[13px] ${focus}`}>
          {actions.copyLabel}
        </button>
        <button {...actions.printProps} className={`os-pill text-[13px] ${focus}`}>
          Print
        </button>
        <SaveCardButton persona={persona} card={card} />
        <span role="status" aria-live="polite" className="os-meta">
          {actions.copyStatus}
        </span>
      </div>
    </article>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2 border-t border-border pt-4 print:border-[#111111]">
      <h3 className="os-kicker m-0 font-normal tracking-normal print:text-[#111111]">{label}</h3>
      {children}
    </section>
  )
}
