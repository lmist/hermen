// OWNER: cards agent (bead hermen-wgg.11). Stub until saved cards land; keep the export name and props.
import type { PersonaId, PrepCard } from '#/lib/hermen'

export function SaveCardButton(_props: { persona: PersonaId; card: PrepCard }) {
  return (
    <button type="button" className="os-pill" disabled>
      Save card (coming soon)
    </button>
  )
}
