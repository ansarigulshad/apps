import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { OAUTH_CHANNEL_NAME } from './lib/auth';
import './styles/index.css';

/**
 * When this page loads as the OAuth popup's final stop (redirected here by
 * the Worker with the token in the URL fragment), relay it to the main tab
 * and close — never mount the full app in the popup. See lib/auth.ts for why
 * this uses BroadcastChannel instead of window.opener.
 */
function relayOAuthResultIfPresent(): boolean {
  const match = window.location.hash.match(/gh_oauth_(token|error)=([^&]*)/);
  if (!match) return false;

  const [, kind, value] = match;
  const channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
  channel.postMessage(
    kind === 'token'
      ? { type: 'token', token: decodeURIComponent(value) }
      : { type: 'error', error: decodeURIComponent(value) }
  );
  channel.close();

  document.getElementById('root')!.textContent =
    kind === 'token' ? 'Signed in — you can close this window.' : 'Sign-in failed — you can close this window.';
  window.close();
  return true;
}

if (!relayOAuthResultIfPresent()) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
