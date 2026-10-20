import { Link } from '@tanstack/react-router'

import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="no-print flex items-center gap-7 border-b border-border px-[22px] py-[18px]">
      <Link to="/" className="os-brand text-foreground no-underline">
        hermen
      </Link>
      <nav className="flex gap-[18px] text-sm">
        <Link to="/" className="text-muted-foreground no-underline hover:text-foreground">
          Prep
        </Link>
        <a href="/deck.html" className="text-muted-foreground no-underline hover:text-foreground">
          Deck
        </a>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  )
}
