# One-time setup

Everything here is manual by necessity: creating a GitHub OAuth App, deploying
a Worker, and minting a scoped PAT all require the GitHub/Cloudflare web UI or
credentials I (Claude) don't have access to. Nothing in this repo works until
these are done.

## 1. Register a GitHub OAuth App

GitHub Settings → Developer settings → OAuth Apps → New OAuth App.

- **Homepage URL**: `https://gulshadansari.in/apps/birthday-bot/`
- **Authorization callback URL**: `https://<your-worker-subdomain>/callback`
  (you'll get this URL in step 2 — come back and set it after deploying the
  Worker, or use the workers.dev URL you expect in advance)

Copy the **Client ID**. Generate a **Client Secret** and keep it — it goes
into the Worker only, never into this repo.

## 2. Deploy the OAuth-exchange Worker

```sh
cd worker/oauth-exchange
npm install
npx wrangler login
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put ALLOWED_ORIGIN   # https://gulshadansari.in
npx wrangler deploy
```

This prints a `*.workers.dev` URL. Set that (plus `/callback`) as the OAuth
App's callback URL from step 1. Optionally map a nicer route (e.g.
`api.gulshadansari.in/oauth/*`) in the Cloudflare dashboard — not required.

## 3. Create a fine-grained deploy PAT

This lets the `apps` repo's Actions workflow push built apps into your
`ansarigulshad.github.io` repo.

GitHub Settings → Developer settings → Fine-grained tokens → Generate new:

- **Repository access**: only `ansarigulshad.github.io`
- **Permissions**: Contents → Read and write

Add it as a secret named `PAGES_DEPLOY_TOKEN` on the **`apps`** repo (Settings
→ Secrets and variables → Actions → New repository secret).

## 4. Set build-time repo variables on `apps`

Settings → Secrets and variables → Actions → Variables tab:

- `GITHUB_OAUTH_CLIENT_ID` — the Client ID from step 1 (not secret, just
  needs to be baked into the built JS)
- `OAUTH_WORKER_URL` — the Worker URL from step 2, e.g.
  `https://birthday-bot-oauth.<you>.workers.dev`

## 5. Push to `main`

The `deploy.yml` workflow builds `apps/birthday-bot` and syncs it into
`ansarigulshad.github.io/apps/birthday-bot/`. Once that repo's Pages build
picks it up, the app is live at `gulshadansari.in/apps/birthday-bot/`.

## Notes / limits

- The GitHub OAuth token the app gets is held in memory only (React state) —
  refreshing the page signs you out. That's deliberate: this is a public
  static page, so nothing worth stealing should sit in localStorage.
- The OAuth scope requested is `repo` (needed to read/write a private repo's
  contents and open PRs). It will show as full repo access in GitHub's
  consent screen — expected for a private-repo tool, not a bug.
- Every add goes through a branch + pull request, never a direct push to
  `main` — review stays in your hands.
