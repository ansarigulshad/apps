import { useCallback, useEffect, useState } from 'react';
import SignInGate from './components/SignInGate';
import UpcomingBirthdays from './components/UpcomingBirthdays';
import BirthdayList from './components/BirthdayList';
import AddBirthdayForm from './components/AddBirthdayForm';
import PrBanner from './components/PrBanner';
import { signInWithGitHub } from './lib/auth';
import { AuthedUser, BirthdaysFile, fetchBirthdays, fetchViewer, openAddBirthdayPr } from './lib/github';
import { Birthday } from './lib/dates';

export default function App() {
  // In-memory only — deliberately not persisted, see docs/SETUP.md.
  const [token, setToken] = useState<string | null>(null);
  const [viewer, setViewer] = useState<AuthedUser | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [file, setFile] = useState<BirthdaysFile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const loadData = useCallback(async (t: string) => {
    setLoadError(null);
    try {
      const [u, f] = await Promise.all([fetchViewer(t), fetchBirthdays(t)]);
      setViewer(u);
      setFile(f);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load birthdays.json.');
    }
  }, []);

  useEffect(() => {
    if (token) loadData(token);
  }, [token, loadData]);

  async function handleSignIn() {
    setSigningIn(true);
    setAuthError(null);
    try {
      const t = await signInWithGitHub();
      setToken(t);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSigningIn(false);
    }
  }

  async function handleAdd(entry: Birthday) {
    if (!token || !file) throw new Error('Not signed in yet.');
    const pr = await openAddBirthdayPr(token, entry, file);
    setPrUrl(pr.url);
    await loadData(token);
  }

  if (!token) {
    return <SignInGate onSignIn={handleSignIn} isSigningIn={signingIn} error={authError} />;
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl text-ink">Birthday Bot</h1>
          <p className="font-body text-sm text-ink/50 mt-1">ansarigulshad/birthday-bot</p>
        </div>
        {viewer && (
          <div className="flex items-center gap-2">
            <img src={viewer.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-ink/10" />
            <span className="font-body text-sm text-ink/60">{viewer.login}</span>
          </div>
        )}
      </header>

      {prUrl && <PrBanner url={prUrl} onDismiss={() => setPrUrl(null)} />}

      {loadError && (
        <p className="font-body text-berry text-sm mb-6">{loadError}</p>
      )}

      {file && (
        <div className="space-y-10">
          <UpcomingBirthdays entries={file.entries} />
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <BirthdayList entries={file.entries} />
            <AddBirthdayForm existing={file.entries} onSubmit={handleAdd} />
          </div>
        </div>
      )}

      {!file && !loadError && (
        <p className="font-body text-ink/50">Loading birthdays.json…</p>
      )}
    </div>
  );
}
