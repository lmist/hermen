import { useStore } from '@tanstack/react-store'
import { HermenShader } from '#/components/shaders/HermenShader.webgl'
import { HermaShader } from '#/components/shaders/HermaShader.webgl'
import type { PersonaId } from '#/lib/hermen'
import { themeStore } from '#/lib/store/theme'

const SHADER_BG = { dark: '#0c0c0c', light: '#f4f1ea' }

/** The persona's live shader, following the site theme. */
export function usePersonaShaderTheme() {
  return useStore(themeStore, (s) => s.resolved)
}

export function PersonaShader({ persona, className }: { persona: PersonaId; className?: string }) {
  const theme = usePersonaShaderTheme()
  const Shader = persona === 'hermen' ? HermenShader : HermaShader
  return <Shader theme={theme} background={SHADER_BG} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />
}
