// Voice mode helpers, shared by the browser and the Worker.
// Masky splits speech into a new clip after every 3 sentences ('.', '!' or '?' + whitespace)
// and rejects userText over 500 chars. splitForSpeech keeps each chunk to <=3 sentences and
// <=480 chars, so one /api/speak call always gives exactly one audio clip.

export const VOICE_STYLE = { emotion: 'contentment', prosody: ['speed_slow'] } as const

export const SPEECH_CHUNK_MAX_CHARS = 480

/** Strip markdown so the voice reads clean text. */
export function toSpeakable(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hardSplit(sentence: string, max: number): string[] {
  const out: string[] = []
  let cur = ''
  for (const word of sentence.split(' ')) {
    if (cur && `${cur} ${word}`.length > max) {
      out.push(cur)
      cur = word
    } else {
      cur = cur ? `${cur} ${word}` : word
    }
  }
  if (cur) out.push(cur)
  return out
}

/** Split a reply into chunks of <=3 sentences and <=max chars, in reading order. */
export function splitForSpeech(text: string, max = SPEECH_CHUNK_MAX_CHARS): string[] {
  const clean = toSpeakable(text)
  if (!clean) return []
  const chunks: string[] = []
  let cur: string[] = []
  const flush = () => {
    if (cur.length) chunks.push(cur.join(' '))
    cur = []
  }
  for (const sentence of clean.split(/(?<=[.!?])\s+/)) {
    if (sentence.length > max) {
      flush()
      chunks.push(...hardSplit(sentence, max))
      continue
    }
    if (cur.length >= 3 || [...cur, sentence].join(' ').length > max) flush()
    cur.push(sentence)
  }
  flush()
  return chunks
}
