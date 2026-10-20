import { useState, useSyncExternalStore } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { PERSONAS, WANT_LABELS, isPersonaId } from '#/lib/hermen'
import type { Intake, PersonaId } from '#/lib/hermen'
import { startPrep } from '#/lib/store/prep'
import { IntakeForm } from '#/components/hermen/intake-form'
import { PrepChat } from '#/components/hermen/prep-chat'
import { VoiceNotes, VoiceToggle } from '#/components/voice/voice-controls'

export const Route = createFileRoute('/prep/$persona')({
  beforeLoad: ({ params }) => {
    if (!isPersonaId(params.persona)) throw redirect({ to: '/' })
  },
  head: ({ params }) => ({
    meta: [
      {
        title: isPersonaId(params.persona)
          ? `Prep with ${PERSONAS[params.persona].name} · Hermen — get ready to be understood`
          : 'Hermen — get ready to be understood',
      },
    ],
  }),
  component: PrepPage,
})

/** Mechanism: intake first (skippable), then the chat with those answers. */
function usePrepPage(persona: PersonaId) {
  const [intake, setIntake] = useState<Intake | null>(null)
  const start = (answers: Intake) => {
    startPrep(persona, answers)
    setIntake(answers)
  }
  const summary = intake
    ? [intake.sessionWhen && `Session: ${intake.sessionWhen}`, intake.want && WANT_LABELS[intake.want]].filter(Boolean).join(' · ')
    : ''
  // Probe (hermen-wgg.16): voice controls render after hydration only.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  return { persona: PERSONAS[persona], intake, start, summary, hydrated }
}

function PrepPage() {
  const { persona: id } = Route.useParams()
  return <PrepFlow key={id} persona={id as PersonaId} />
}

function PrepFlow({ persona }: { persona: PersonaId }) {
  const page = usePrepPage(persona)
  const p = page.persona

  return (
    <main className="mx-auto max-w-[760px] px-4 pt-8 pb-8 sm:px-[22px] sm:pt-12 print:max-w-none print:p-0">
      <div className="mb-8 grid gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <img src={p.image} alt="" width={48} height={48} className="size-12 rounded-[14px] border border-border object-cover" />
          <div className="grid min-w-0 gap-0.5">
            <p className="m-0 text-[15px] tracking-[-0.03em]">Prep with {p.name}</p>
            <p className="os-meta m-0 truncate">{page.summary || p.tagline}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {page.hydrated ? <VoiceToggle persona={persona} /> : null}
            <Link
              to="/"
              className="os-pill text-[12px] no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Change guide
            </Link>
          </div>
        </div>
        {page.hydrated ? <VoiceNotes persona={persona} /> : null}
      </div>

      {page.intake ? (
        <PrepChat persona={persona} intake={page.intake} />
      ) : (
        <IntakeForm persona={p} onStart={page.start} />
      )}
    </main>
  )
}
