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
 * an access token and posts it to the opener window via postMessage, scoped
 * to ALLOWED_ORIGIN only.
 */

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_ORIGIN: string; // e.g. https://gulshadansari.in
}

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

    const payload = tokenJson.access_token
      ? { type: 'gh-oauth-token', token: tokenJson.access_token }
      : { type: 'gh-oauth-error', error: tokenJson.error_description ?? tokenJson.error ?? 'unknown_error' };

    const html = `<!doctype html>
<html><body style="font-family: sans-serif; padding: 2rem;">
<p>${tokenJson.access_token ? 'Signed in — you can close this window.' : 'Sign-in failed — you can close this window.'}</p>
<script>
  if (window.opener) {
    window.opener.postMessage(${JSON.stringify(payload)}, ${JSON.stringify(env.ALLOWED_ORIGIN)});
  }
  window.close();
</script>
</body></html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  },
};
