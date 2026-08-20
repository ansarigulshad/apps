import { GITHUB_CLIENT_ID, OAUTH_WORKER_URL } from './config';

/**
 * Opens a GitHub OAuth popup and resolves with an access token.
 * The token exchange happens in a Worker (see /worker/oauth-exchange) since
 * it needs a client_secret that must never ship to the browser. This module
 * only ever holds the token in memory — nothing touches localStorage.
 */
export function signInWithGitHub(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!GITHUB_CLIENT_ID || !OAUTH_WORKER_URL) {
      reject(new Error('OAuth is not configured yet — missing VITE_GITHUB_CLIENT_ID / VITE_OAUTH_WORKER_URL.'));
      return;
    }

    const state = crypto.randomUUID();
    const redirectUri = `${OAUTH_WORKER_URL.replace(/\/$/, '')}/callback`;
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', 'repo');
    authorizeUrl.searchParams.set('state', state);

    const popup = window.open(authorizeUrl.toString(), 'gh-oauth', 'width=520,height=680');
    if (!popup) {
      reject(new Error('Popup was blocked — allow popups for this site and try again.'));
      return;
    }

    const workerOrigin = new URL(OAUTH_WORKER_URL).origin;
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearInterval(pollClosed);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== workerOrigin) return;
      const data = event.data as { type?: string; token?: string; error?: string };
      if (data?.type === 'gh-oauth-token' && data.token) {
        settled = true;
        cleanup();
        resolve(data.token);
      } else if (data?.type === 'gh-oauth-error') {
        settled = true;
        cleanup();
        reject(new Error(data.error ?? 'GitHub sign-in failed.'));
      }
    };

    const pollClosed = window.setInterval(() => {
      if (popup.closed && !settled) {
        cleanup();
        reject(new Error('Sign-in window was closed before completing.'));
      }
    }, 500);

    window.addEventListener('message', onMessage);
  });
}
