import { GITHUB_CLIENT_ID, OAUTH_WORKER_URL } from './config';

export const OAUTH_CHANNEL_NAME = 'gh-oauth';

/**
 * Opens a GitHub OAuth popup and resolves with an access token.
 *
 * The token exchange happens in a Worker (see /worker/oauth-exchange) since
 * it needs a client_secret that must never ship to the browser. This module
 * only ever holds the token in memory — nothing touches localStorage.
 *
 * Communication back from the popup uses BroadcastChannel, not
 * window.opener.postMessage: github.com sends
 * Cross-Origin-Opener-Policy: same-origin, which severs window.opener on the
 * popup as soon as it loads the authorize screen. BroadcastChannel is
 * same-origin-scoped pub/sub and doesn't depend on the opener relationship,
 * so it survives that. See main.tsx for the popup-side relay.
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

    const channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
    let settled = false;

    const cleanup = () => {
      channel.close();
      clearInterval(pollClosed);
    };

    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; token?: string; error?: string };
      if (data?.type === 'token' && data.token) {
        settled = true;
        cleanup();
        resolve(data.token);
      } else if (data?.type === 'error') {
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
  });
}
