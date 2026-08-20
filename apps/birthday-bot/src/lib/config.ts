export const GITHUB_OWNER = 'ansarigulshad';
export const GITHUB_REPO = 'birthday-bot';
export const TARGET_BRANCH = 'main';
export const FILE_PATH = 'birthdays.json';

// Public OAuth App client id — safe to ship in the bundle, set at build time.
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID ?? '';

// The Worker that exchanges an OAuth `code` for a token (holds the secret).
// e.g. https://birthday-bot-oauth.<you>.workers.dev
export const OAUTH_WORKER_URL = import.meta.env.VITE_OAUTH_WORKER_URL ?? '';
