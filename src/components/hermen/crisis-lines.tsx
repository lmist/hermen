import { CRISIS_MESSAGE, CRISIS_RESOURCES } from '#/lib/hermen'

const link =
  'rounded-sm text-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** The hard-coded crisis lines (tel: and web links). */
export function CrisisLines() {
  return (
    <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
      {CRISIS_RESOURCES.map((r) => (
        <li key={r.label} className="grid gap-0.5">
          {r.href ? (
            <a
              className={link}
              href={r.href}
              {...(r.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {r.label}
            </a>
          ) : (
            <span className="text-foreground">{r.label}</span>
          )}
          <span className="os-meta">{r.detail}</span>
        </li>
      ))}
    </ul>
  )
}

/** Sticky panel shown the moment a user message matches detectCrisis, whatever the model says. */
export function CrisisPanel() {
  return (
    <section
      role="alert"
      aria-labelledby="crisis-title"
      className="sticky top-2 z-10 grid gap-3 rounded-[14px] border border-destructive bg-card p-4"
    >
      <h2 id="crisis-title" className="m-0 text-lg">
        Please pause the prep.
      </h2>
      <p className="m-0 text-[15px]">{CRISIS_MESSAGE}</p>
      <CrisisLines />
    </section>
  )
}
