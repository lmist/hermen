import { useEffect } from 'react'

/** The one sanctioned effect: sync with an external system on mount, clean up on unmount. */
export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line no-restricted-syntax, react-hooks/exhaustive-deps
  useEffect(effect, [])
}
