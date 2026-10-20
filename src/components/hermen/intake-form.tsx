import { useForm } from '@tanstack/react-form'
import { WANT_LABELS } from '#/lib/hermen'
import type { Intake, Persona, SessionWant } from '#/lib/hermen'

const focus = 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
const WANTS = Object.entries(WANT_LABELS) as Array<[SessionWant, string]>

interface IntakeValues {
  sessionWhen: string
  want: SessionWant | ''
  context: string
}

function toIntake(v: IntakeValues): Intake {
  return {
    ...(v.sessionWhen.trim() ? { sessionWhen: v.sessionWhen.trim() } : {}),
    ...(v.want ? { want: v.want } : {}),
    ...(v.context.trim() ? { context: v.context.trim() } : {}),
  }
}

/** Mechanism: TanStack Form state plus submit / skip handlers. */
export function useIntakeForm(onStart: (intake: Intake) => void) {
  const form = useForm({
    defaultValues: { sessionWhen: '', want: '', context: '' } as IntakeValues,
    onSubmit: ({ value }) => onStart(toIntake(value)),
  })

  return {
    form,
    formProps: {
      noValidate: true,
      onSubmit: (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      },
    },
    skipProps: { type: 'button' as const, onClick: () => onStart({}) },
  }
}

export function IntakeForm({ persona, onStart }: { persona: Persona; onStart: (intake: Intake) => void }) {
  const { form, formProps, skipProps } = useIntakeForm(onStart)

  return (
    <form {...formProps} aria-labelledby="intake-title" className="grid gap-8">
      <div className="grid gap-2">
        <p className="os-kicker m-0">Before we start · optional</p>
        <h1 id="intake-title" className="m-0 text-[clamp(30px,4.4vw,48px)]">
          A few quick things for {persona.name}.
        </h1>
        <p className="m-0 text-[15px] text-muted-foreground">Answer any, all, or none. You can skip straight to the chat.</p>
      </div>

      <form.Field name="sessionWhen">
        {(field) => (
          <div className="grid gap-2">
            <label htmlFor={field.name} className="os-kicker">
              When is your session?
            </label>
            <input
              id={field.name}
              name={field.name}
              type="text"
              autoComplete="off"
              placeholder="Thursday, in an hour…"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="os-field w-full placeholder:text-muted-foreground focus-visible:border-b-2"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="want">
        {(field) => (
          <fieldset className="m-0 grid gap-2 border-0 p-0">
            <legend className="os-kicker mb-2 p-0">What do you want from it?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {WANTS.map(([value, label]) => (
                <label
                  key={value}
                  className="os-tile flex cursor-pointer items-center gap-3 text-[15px] has-[:checked]:border-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={value}
                    checked={field.state.value === value}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange(value)}
                    className="size-4 accent-[var(--foreground)] focus-visible:outline-none"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Field name="context">
        {(field) => (
          <div className="grid gap-2">
            <label htmlFor={field.name} className="os-kicker">
              Anything your therapist already knows? (or "first session")
            </label>
            <textarea
              id={field.name}
              name={field.name}
              rows={3}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className={`w-full resize-y rounded-[14px] border border-border bg-transparent p-3 text-[15px] text-foreground placeholder:text-muted-foreground ${focus}`}
              placeholder="We've met a few times. She knows about my job."
            />
          </div>
        )}
      </form.Field>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={`os-pill os-pill-solid text-[13px] ${focus}`}>
          Start with {persona.name}
        </button>
        <button {...skipProps} className={`os-pill text-[13px] ${focus}`}>
          Skip
        </button>
      </div>
    </form>
  )
}
