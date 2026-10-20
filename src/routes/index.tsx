import { createFileRoute } from '@tanstack/react-router'
import { NOT_A_THERAPIST, PERSONA_IDS } from '#/lib/hermen'
import { CrisisLines } from '#/components/hermen/crisis-lines'
import { PersonaCard } from '#/components/hermen/persona-card'

export const Route = createFileRoute('/')({ component: Landing })

const STEPS: ReadonlyArray<[string, string]> = [
  ['Pick your guide', 'Hermen or Herma. Same brain, same rules, different face and voice.'],
  ['Say it messy', 'However it comes out is fine. One gentle question at a time.'],
  ['"Here\'s what I heard"', 'Your words come back to you, with one phrase a therapist could read two ways. You correct it.'],
  ['Say it three ways', 'The hardest thing, written plain, gentle, and with an example.'],
  ['Take your prep card', 'One page to bring to your session. Print it, copy it, or keep it on your phone.'],
]

function Landing() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 pt-10 pb-8 sm:px-[22px] sm:pt-14">
      <section aria-labelledby="hero-title" className="grid gap-5">
        <p className="os-kicker m-0">AI Workforce 2026 · therapy prep</p>
        <h1 id="hero-title" className="m-0 text-[clamp(36px,6vw,64px)]">
          Get ready to be understood.
        </h1>
        <p className="m-0 max-w-[640px] text-[17px] leading-relaxed text-muted-foreground">
          Hermeneutics is the study of how people understand each other: the gap between what you say and what
          the other person hears. Therapy is where that gap hurts most. Hermen helps you find your words before the
          session, checks that they carry what you mean, and gives you a one-page card to bring.
        </p>
      </section>

      <section aria-label="Choose your guide" className="mt-12 grid gap-8 sm:grid-cols-2 sm:gap-6">
        {PERSONA_IDS.map((id) => (
          <PersonaCard key={id} persona={id} />
        ))}
      </section>

      <section aria-labelledby="steps-title" className="mt-16 grid gap-4">
        <p className="os-kicker m-0">About 10 minutes</p>
        <h2 id="steps-title" className="m-0 text-[clamp(26px,3.4vw,38px)]">
          How a prep goes
        </h2>
        <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="os-tile grid content-start gap-1">
              <span className="os-meta">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[15px] tracking-[-0.03em]">{title}</span>
              <span className="text-[13px] text-muted-foreground">{body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="safety-title" className="os-tile mt-10 grid gap-4 p-5 hover:bg-transparent">
        <div className="grid gap-1">
          <h2 id="safety-title" className="m-0 text-xl">
            {NOT_A_THERAPIST}
          </h2>
          <p className="m-0 text-[14px] text-muted-foreground">
            Hermen helps you prepare for real therapy; it does not replace it. We don't save your conversation: it
            lives in this tab. If you are in crisis, please reach out now:
          </p>
        </div>
        <CrisisLines />
      </section>
    </main>
  )
}
