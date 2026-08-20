/**
 * Minimal GitHub OAuth "code -> token" relay.
 *
 * This exists only because GitHub's token endpoint requires a client_secret
 * and does not send CORS headers, so a static site (GitHub Pages) can't call
 * it directly. This Worker holds the secret and does nothing else — it never
 * touches birthdays.json or the GitHub API beyond this one exchange.
 *
 * Flow: browser opens a popup to github.com/login/oauth/authorize, GitHub
 * redirects the popup back here with ?code=..., this Worker exchanges it for
 * an access token and redirects the popup back to the app with the token in
 * the URL fragment (never sent to any server). The app relays it to the main
 * tab via BroadcastChannel.
 *
 * Deliberately NOT using window.opener.postMessage: github.com sends
 * Cross-Origin-Opener-Policy: same-origin, which permanently severs
 * window.opener on this popup the moment it loads the authorize screen —
 * even after redirecting back here. window.opener is null by the time this
 * code runs, so anything depending on it silently no-ops.
 */

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_ORIGIN: string; // e.g. https://gulshadansari.in
}

const APP_PATH = '/apps/birthday-bot/';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/callback') {
      return new Response('Not found', { status: 404 });
    }

    const code = url.searchParams.get('code');
    if (!code) {
      return new Response('Missing code', { status: 400 });
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenJson = await tokenRes.json<{
      access_token?: string;
      error?: string;
      error_description?: string;
    }>();

    const appUrl = new URL(APP_PATH, env.ALLOWED_ORIGIN);
    if (tokenJson.access_token) {
      appUrl.hash = `gh_oauth_token=${encodeURIComponent(tokenJson.access_token)}`;
    } else {
      const message = tokenJson.error_description ?? tokenJson.error ?? 'unknown_error';
      appUrl.hash = `gh_oauth_error=${encodeURIComponent(message)}`;
    }

    return Response.redirect(appUrl.toString(), 302);
  },
};
