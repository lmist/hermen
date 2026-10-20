import { Link, createFileRoute } from '@tanstack/react-router'
import { NOT_A_THERAPIST } from '#/lib/hermen'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'About · Hermen — get ready to be understood' }] }),
  component: About,
})

function About() {
  return (
    <main className="mx-auto grid max-w-[760px] gap-6 px-4 pt-10 pb-8 sm:px-[22px] sm:pt-14">
      <p className="os-kicker m-0">About</p>
      <h1 className="m-0 text-[clamp(32px,4.4vw,52px)]">The gap between what you say and what is heard.</h1>
      <p className="m-0 text-[17px] leading-relaxed text-muted-foreground">
        Hermeneutics is the study of how people understand each other. The word comes from Hermes, the Greek
        messenger who carried words between gods and humans. In therapy you arrive vulnerable, on a clock, trying to
        say things you may never have said out loud. You say something close to what you mean, and your therapist
        hears it through their own lens.
      </p>
      <p className="m-0 text-[17px] leading-relaxed text-muted-foreground">
        Hermen and Herma help you do the work first: say it messy, hear it back, fix the words that could be misread,
        and leave with a one-page prep card. Preparing with an AI before real therapy, not instead of it.
      </p>
      <p className="os-meta m-0">{NOT_A_THERAPIST}</p>
      <div>
        <Link to="/" className="os-pill os-pill-solid text-[13px] no-underline">
          Pick your guide
        </Link>
      </div>
    </main>
  )
}
