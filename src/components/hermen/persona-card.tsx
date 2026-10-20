import { useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PERSONAS } from '#/lib/hermen'
import type { PersonaId } from '#/lib/hermen'
import { useAvatar } from './avatars'
import { PersonaShader } from './persona-shader'

const focus = 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** Mechanism: persona data, the "Hear hello" disclosure and the Masky intro URL. */
export function usePersonaCard(persona: PersonaId) {
  const p = PERSONAS[persona]
  const avatar = useAvatar(persona)
  const [introOpen, setIntroOpen] = useState(false)
  const introId = useId()

  const introUrl = avatar.data?.introLiveUrl
  return {
    persona: p,
    portrait: avatar.data?.imageUrl ?? p.image,
    introOpen,
    introUrl,
    introStatus: avatar.isError ? 'error' : introUrl ? 'ready' : 'loading',
    introTitle: `${p.name} says hello (Masky video)`,
    hearProps: {
      type: 'button' as const,
      'aria-expanded': introOpen,
      'aria-controls': introId,
      onClick: () => setIntroOpen((v) => !v),
    },
    hearLabel: introOpen ? 'Hide hello' : 'Hear hello',
    introProps: { id: introId, hidden: !introOpen },
  }
}

export function PersonaCard({ persona }: { persona: PersonaId }) {
  const card = usePersonaCard(persona)
  const p = card.persona

  return (
    <article aria-labelledby={`${p.id}-name`} className="grid content-start gap-4">
      <div className="os-card relative aspect-[0.72] w-full sm:aspect-[0.8]">
        <div className="absolute inset-0" aria-hidden="true">
          <PersonaShader persona={persona} />
        </div>
        <img
          src={card.portrait}
          alt={`Portrait of ${p.name}`}
          width={112}
          height={112}
          className="absolute top-4 left-4 size-24 rounded-[14px] border border-border object-cover shadow-[0_30px_80px_-40px_rgb(0_0_0/55%)] sm:size-28"
        />
        <div className="absolute right-4 bottom-4 left-4 grid gap-1">
          <h2 id={`${p.id}-name`} className="m-0 text-3xl dark:[text-shadow:0_1px_12px_rgb(0_0_0/40%)]">
            {p.name}
          </h2>
          <p className="m-0 text-[15px] tracking-[-0.03em] dark:[text-shadow:0_1px_12px_rgb(0_0_0/40%)]">{p.tagline}</p>
        </div>
      </div>

      <p className="os-meta m-0">{p.nameMeaning}</p>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/prep/$persona"
          params={{ persona }}
          className={`os-pill os-pill-solid text-[13px] no-underline ${focus}`}
        >
          Prep with {p.name}
        </Link>
        <button {...card.hearProps} className={`os-pill text-[13px] ${focus}`}>
          {card.hearLabel}
        </button>
      </div>

      <div {...card.introProps} className="overflow-hidden rounded-[14px] border border-border">
        {card.introOpen && card.introStatus === 'ready' ? (
          <iframe
            src={card.introUrl}
            title={card.introTitle}
            className="block aspect-video w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : null}
        {card.introOpen && card.introStatus === 'loading' ? (
          <p className="os-meta m-0 grid aspect-video place-items-center">Loading the hello…</p>
        ) : null}
        {card.introOpen && card.introStatus === 'error' ? (
          <p className="os-meta m-0 grid aspect-video place-items-center">The hello video did not load.</p>
        ) : null}
      </div>
    </article>
  )
}
