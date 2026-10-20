import { createFileRoute } from '@tanstack/react-router'

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  return value
}

export const Route = createFileRoute('/auth/login')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const clientId = process.env.MASKY_CLIENT_ID
        if (!clientId) return new Response(null, { status: 302, headers: { Location: `${url.origin}/?auth=failed` } })
        const base = process.env.MASKY_BASE || 'https://masky.ai'
        const returnTo = safeReturnTo(url.searchParams.get('returnTo'))
        const state = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
        const authorize = new URL(`${base}/oauth-authorize.html`)
        authorize.searchParams.set('client_id', clientId)
        authorize.searchParams.set('redirect_uri', `${url.origin}/auth/callback`)
        authorize.searchParams.set('scope', 'profile')
        authorize.searchParams.set('state', state)
        const cookie = `hermen_oauth=${state}.${encodeURIComponent(returnTo)}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
        return new Response(null, {
          status: 302,
          headers: { Location: authorize.toString(), 'Set-Cookie': cookie },
        })
      },
    },
  },
})
