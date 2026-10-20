import { useState } from 'react'

import {
  CARD_LABELS,
  PERSONAS,
  THREE_WAYS_LABELS,
  cardToMarkdown,
  cardTitle,
} from '#/lib/hermen'
import type { PersonaId, PrepCard } from '#/lib/hermen'

const PRINT_ONLY_CARD = `@media print {
  body * { visibility: hidden; }
  .print-card, .print-card * { visibility: visible; }
  .print-card { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
}`

/** Mechanism: copy to clipboard and print. */
function useCardActions(card: PrepCard) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(cardToMarkdown(card))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return { copied, copy, print: () => window.print() }
}

export function CardView({
  persona,
  card,
  createdAt,
}: {
  persona: PersonaId
  card: PrepCard
  createdAt?: string
}) {
  const { copied, copy, print } = useCardActions(card)
  const name = PERSONAS[persona].name

  return (
    <div className="grid gap-4">
      <style>{PRINT_ONLY_CARD}</style>
      <div className="no-print flex gap-2">
        <button type="button" className="os-pill" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="os-pill" onClick={print}>
          Print
        </button>
      </div>
      <article className="os-card print-card grid gap-6 p-6 sm:p-8">
        <header>
          <p className="os-kicker">Prep card with {name}</p>
          <h1 className="mt-2 text-3xl">{cardTitle(card)}</h1>
          {createdAt && (
            <p className="os-meta mt-2">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          )}
        </header>
        <section>
          <h2 className="os-kicker">{CARD_LABELS.understand}</h2>
          <p className="mt-1">{card.understand}</p>
        </section>
        <section>
          <h2 className="os-kicker">{CARD_LABELS.threeWays}</h2>
          <ul className="mt-1 grid gap-2 p-0">
            {card.threeWays.map((version, i) => (
              <li key={i} className="list-none">
                <span className="os-meta">
                  {THREE_WAYS_LABELS[i] ?? `Version ${i + 1}`}
                </span>
                <p className="m-0">{version}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="os-kicker">{CARD_LABELS.misread}</h2>
          <ul className="mt-1 grid gap-2 p-0">
            {card.misread.map((m, i) => (
              <li key={i} className="list-none">
                <span className="os-meta">&ldquo;{m.phrase}&rdquo;</span>
                <p className="m-0">{m.meaning}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="os-kicker">{CARD_LABELS.want}</h2>
          <p className="mt-1">{card.want}</p>
        </section>
        <section>
          <h2 className="os-kicker">{CARD_LABELS.checkBack}</h2>
          <p className="mt-1">{card.checkBack}</p>
        </section>
      </article>
    </div>
  )
}
