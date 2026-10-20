# Hermen

**Get ready to be understood.**

Hermen helps you get ready for a therapy session. You talk it through first, in private, with Hermen or Herma, two Masky avatars. They reflect back what they heard and flag phrases a therapist could misread. Then they help you say the hardest thing three ways and give you a one-page prep card to bring to your session.

- **Live app:** https://hermen.oxwilde.workers.dev
- **Deck:** https://hermen.oxwilde.workers.dev/deck.html
- **Product plan:** [PLAN.md](PLAN.md)
- **Hackathon Simplified Technical English:** [ASD-STE100.md](ASD-STE100.md) (the project described in ASD-STE100 Simplified Technical English)
- **Hackathon brief:** [hackathon.md](hackathon.md)
- **License (code):** [MIT](LICENSE)
- **License (session content):** [OPEN-SESSION-LICENSE.md](OPEN-SESSION-LICENSE.md)

## How it works

1. **Pick your guide.** Hermen or Herma. No account needed to start; sign in with Masky (as an avatar, no real name or email) to save cards or use voice.
2. **Say it messy.** Hermen asks one gentle question at a time. No rush, no judgment.
3. **"Here's what I heard."** Hermen reflects back what it understood, then flags words that could be read two ways. You correct it.
4. **Say it three ways.** For the hardest thing, Hermen helps you write a plain version, a gentle version, and a version with an example.
5. **Take your prep card.** One page: what you most want your therapist to understand, the hardest thing three ways, words that might be misread, what you want from the session, and a check-back question: *"Can you tell me what you heard?"*

**Voice mode (optional):** turn on voice and Hermen or Herma read each reply aloud in their own Masky voice, and you can speak instead of type (browser speech recognition). Voice needs Masky sign-in.

## Safety

- Hermen is not a therapist and is not for emergencies.
- If you mention suicide, self-harm, or being in danger, Hermen stops the exercise and shows crisis lines. This is hard-coded in the page; the AI does not decide it.
  - **988** (US)
  - **116 123** Samaritans (UK and Ireland)
  - **findahelpline.com** (anywhere)
  - Or your local emergency number.
- Chats are never stored. They live in your browser tab and are gone when you close it.
- Only the prep card is saved, and only if you choose to save it. You can delete it at any time.
- Voice is opt-in. When it's on, the guide's replies are sent to Masky to make the audio, and the mic uses your browser's speech recognition.

## Built with

- **TanStack Start, Router, Query, Form, Store, DB, AI, CLI, Intent** (app and AI layer)
- **Cloudflare Workers** (hosting)
- **Prisma Postgres** (database)
- **Masky avatars** and **Login with Masky** (Hermen and Herma faces, voices, and sign-in)
- **GitHub Actions** (deploy)
- **beads** (task tracking)

## Run locally

Requires pnpm.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000.

Put environment variables in `.env.local`. This file is never committed.

- `ANTHROPIC_API_KEY` (or `GEMINI_API_KEY` or `OPENAI_API_KEY`)
- `DATABASE_URL`
- `MASKY_CLIENT_ID`
- `MASKY_CLIENT_SECRET`
- `SESSION_SECRET`
- `AUTH_MODE` (`open` or `masky`)

## Deploy

Every push to `main` deploys to Cloudflare Workers through `.github/workflows/deploy.yml`. The repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be set.

## Built by an agent swarm

Parallel AI agents built this repo. Each agent owns its own files, coordinates through beads, and pushes to `main`.
