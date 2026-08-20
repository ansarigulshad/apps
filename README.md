# apps

Source for small apps hosted at `gulshadansari.in/apps/<appname>/`.

Each app lives in `apps/<appname>/` as its own buildable project. A GitHub
Actions workflow (`.github/workflows/deploy.yml`) builds every app on push to
`main` and syncs its `dist/` output into the `ansarigulshad.github.io` repo
under `apps/<appname>/` — that repo is what actually serves the custom domain,
so this repo never touches DNS or Pages settings directly.

To add a new app: create `apps/<newapp>/`, add it to the `matrix.app` list in
the workflow, and make sure its build output lands in `apps/<newapp>/dist/`.

## Apps

- [`birthday-bot`](apps/birthday-bot) — UI for viewing and adding entries to
  the private `birthday-bot` repo's `birthdays.json`, via pull request. See
  [docs/SETUP.md](docs/SETUP.md) for the one-time setup this app needs before
  it works (OAuth App + Worker + deploy token).
