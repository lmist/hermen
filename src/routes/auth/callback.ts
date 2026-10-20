import { createFileRoute } from '@tanstack/react-router'

import { SESSION_COOKIE, SESSION_MAX_AGE, readCookie, signSession } from '#/lib/session'

const CLEAR_OAUTH = 'hermen_oauth=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'

function redirect(location: string, cookies: Array<string>): Response {
  const headers = new Headers({ Location: location })
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(null, { status: 302, headers })
}

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const fail = () => redirect(`${url.origin}/?auth=failed`, [CLEAR_OAUTH])
        try {
          const code = url.searchParams.get('code')
          const state = url.searchParams.get('state')
          const saved = readCookie(request.headers.get('cookie'), 'hermen_oauth')
          if (!code || !state || !saved) return fail()
          const dot = saved.indexOf('.')
          if (dot < 1 || saved.slice(0, dot) !== state) return fail()
          let returnTo = '/'
          try {
            const r = decodeURIComponent(saved.slice(dot + 1))
            if (r.startsWith('/') && !r.startsWith('//') && !r.includes('\\')) returnTo = r
          } catch {
            // keep default
          }

          const base = process.env.MASKY_BASE || 'https://masky.ai'
          const tokenRes = await fetch(`${base}/api/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grant_type: 'authorization_code',
              code,
              redirect_uri: `${url.origin}/auth/callback`,
              client_id: process.env.MASKY_CLIENT_ID,
              client_secret: process.env.MASKY_CLIENT_SECRET,
            }),
          })
          if (!tokenRes.ok) return fail()
          const token = (await tokenRes.json()) as { access_token?: string }
          if (!token.access_token) return fail()

          const infoRes = await fetch(`${base}/api/oauth/userinfo`, {
            headers: { Authorization: `Bearer ${token.access_token}` },
          })
          if (!infoRes.ok) return fail()
          const info = (await infoRes.json()) as { sub?: string; name?: string; picture?: string }
          if (!info.sub) return fail()

          const value = await signSession({
            sub: info.sub,
            name: info.name || 'Masky user',
            picture: info.picture || null,
          })
          if (!value) return fail()
          const session = `${SESSION_COOKIE}=${value}; Max-Age=${SESSION_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`
          return redirect(`${url.origin}${returnTo}`, [session, CLEAR_OAUTH])
        } catch {
          return fail()
        }
      },
    },
  },
})
