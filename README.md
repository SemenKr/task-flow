# Taskfolio

Portfolio-ready task management app with a real backend flow, polished UI, and production-minded frontend architecture.

## Demo

Live: https://task-flow-samkr.vercel.app/

Demo credentials:

- Email: `free@samuraijs.com`
- Password: `free`

## Why this project stands out

This is not a basic todo list clone. The app is built as a product-style dashboard with:

- authentication against the SamuraiJS API
- RTK Query data fetching and cache invalidation
- typed forms with `react-hook-form` + `zod`
- responsive dashboard layout
- light and dark theme support
- inline task editing
- task filtering and pagination
- polished empty states and loading states
- deploy-ready routing for Vercel

## Stack

- React 19
- TypeScript
- Vite
- Redux Toolkit / RTK Query
- React Router 7
- Tailwind CSS 4
- Radix UI
- React Hook Form
- Zod
- Vitest

## Product highlights

### Authentication flow

Users can sign in through the public SamuraiJS backend. The app keeps auth state in sync with the API and handles captcha requests when the backend requires additional verification.

### Task workspace experience

Each todolist works like a focused workspace:

- add tasks quickly
- edit task titles inline
- mark tasks as completed
- remove tasks and workspaces
- switch between `All`, `Active`, and `Completed`
- paginate through remote task data

### UI quality

The interface was intentionally upgraded for portfolio presentation:

- stronger visual hierarchy
- cleaner typography
- improved dashboard composition
- better empty states
- consistent microcopy
- floating action button for quick workspace creation

## Local run

```bash
pnpm install
pnpm dev
```

App runs on `http://localhost:3000`.

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm test
```

## Production notes

- Build output is split into manual chunks for a cleaner production bundle.
- The project is intended to be deployed on Vercel.
- SPA deep links are handled through [`vercel.json`](/Users/semenkr/Project/IT-Incubator/todolist-01/vercel.json).
- API requests are proxied through `/samurai-api` in both local dev and Vercel production to avoid SamuraiJS CORS restrictions.
- Before deploying, configure this environment variable in Vercel:
  - `VITE_API_KEY`
- A local template is available in [.env.example](/Users/semenkr/Project/IT-Incubator/todolist-01/.env.example).

## What I would add next

- drag and drop task ordering
- optimistic updates for more mutations
- e2e coverage with Playwright
- workspace analytics widget
- richer task metadata like deadlines and priorities in the UI
