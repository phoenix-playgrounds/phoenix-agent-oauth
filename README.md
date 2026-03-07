# Phoenix Agent (Nx)

Nx monorepo: **api** (NestJS + Fastify) and **chat** (React + Vite). The API runs the agent (Gemini, Claude Code, OpenAI Codex, or mock); the chat app is the UI.

## Run API + Chat

1. **Start the API** (port 3000):

   ```sh
   npx nx serve api
   ```

   Set `AGENT_PROVIDER=mock` if you don’t have a provider CLI installed:

   ```sh
   AGENT_PROVIDER=mock npx nx serve api
   ```

2. **Start the chat app** (port 4200):

   ```sh
   npx nx serve chat
   ```

   With the default Vite proxy, the chat app will use `http://localhost:3000` for `/api` and `/ws`. If the API runs on another host/port, set:

   ```sh
   VITE_API_URL=http://localhost:3000
   ```

3. Open **http://localhost:4200**. If `AGENT_PASSWORD` is set, log in with that password first, then use the chat.

## Environment

Copy `.env.example` to `.env` and adjust. Main variables:

- **API:** `PORT`, `AGENT_PASSWORD`, `AGENT_PROVIDER` (mock, gemini, claude-code, openai-codex, opencodex), `MODEL_OPTIONS`, `DATA_DIR`, `SYSTEM_PROMPT_PATH`
- **Chat:** `VITE_API_URL` (only if the API is not on the same origin or not proxied)

## Project layout

- `apps/api` – NestJS API, WebSocket at `/ws`, REST under `/api`
- `apps/chat` – React chat UI (login, chat, auth modal, model selector)
- `docs/API.md` – REST and WebSocket contract
- `old-app/` – Original Express app (kept for reference until migration is verified)

## Tasks

- `npx nx serve api` – run API
- `npx nx serve chat` – run chat
- `npx nx run-many -t lint test build typecheck e2e` – CI
