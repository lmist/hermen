import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/logout')({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(null, {
          status: 302,
          headers: {
            Location: `${new URL(request.url).origin}/`,
            'Set-Cookie': 'hermen_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',
          },
        }),
    },
  },
})
