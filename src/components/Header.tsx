import { Link } from '@tanstack/react-router'
import { UserBadge } from '#/components/auth/sign-in-button'
import ThemeToggle from './ThemeToggle'

const navLink =
  'rounded-sm text-muted-foreground no-underline hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

export default function Header() {
  return (
    <header className="no-print flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-border px-4 py-4 sm:px-[22px] sm:py-[18px]">
      <Link
        to="/"
        className="os-brand rounded-sm text-foreground no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        hermen
      </Link>
      <nav aria-label="Main" className="flex gap-[18px] text-sm">
        <Link to="/" className={navLink}>
          Prep
        </Link>
        <a href="/cards" className={navLink}>
          My cards
        </a>
        <a href="/deck.html" className={navLink}>
          Deck
        </a>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <UserBadge />
        <ThemeToggle />
      </div>
    </header>
  )
}
