import { useStore } from '@tanstack/react-store'
import { useMountEffect } from '#/components/hermen/use-mount-effect'
import { NEXT_MODE, connectTheme, setThemeMode, themeStore } from '#/lib/store/theme'

const MODE_LABEL = { dark: 'Dark', light: 'Light', auto: 'Auto' } as const

export function useThemeToggle() {
  const mode = useStore(themeStore, (s) => s.mode)
  useMountEffect(connectTheme)

  const next = NEXT_MODE[mode]
  const label = `Theme: ${MODE_LABEL[mode].toLowerCase()}. Switch to ${MODE_LABEL[next].toLowerCase()}.`

  return {
    text: MODE_LABEL[mode],
    buttonProps: {
      type: 'button' as const,
      onClick: () => setThemeMode(next),
      'aria-label': label,
      title: label,
    },
  }
}

export default function ThemeToggle() {
  const { text, buttonProps } = useThemeToggle()
  return (
    <button {...buttonProps} className="os-pill focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {text}
    </button>
  )
}
