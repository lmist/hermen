import { NOT_A_THERAPIST } from '#/lib/hermen'

const link = 'text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm'

export default function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-border px-4 pt-8 pb-12 sm:px-[22px]">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0">{NOT_A_THERAPIST}</p>
        <p className="m-0">
          Crisis?{' '}
          <a className={link} href="tel:988">
            988
          </a>{' '}
          (US) ·{' '}
          <a className={link} href="tel:116123">
            116 123
          </a>{' '}
          (UK &amp; IE) ·{' '}
          <a className={link} href="https://findahelpline.com" target="_blank" rel="noreferrer">
            findahelpline.com
          </a>
        </p>
      </div>
    </footer>
  )
}
