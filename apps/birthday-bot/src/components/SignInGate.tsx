interface Props {
  onSignIn: () => void;
  isSigningIn: boolean;
  error: string | null;
}

export default function SignInGate({ onSignIn, isSigningIn, error }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="paper-card rise-in max-w-sm w-full p-10 text-center" style={{ '--tilt': '-1deg' } as React.CSSProperties}>
        <svg width="36" height="52" viewBox="0 0 36 52" className="mx-auto mb-5">
          <rect x="14" y="18" width="8" height="28" rx="2" fill="#E1592F" />
          <rect x="10" y="24" width="16" height="6" fill="#D9A62E" />
          <path
            className="flame"
            d="M18 0c3 5 5 8 5 12a5 5 0 1 1-10 0c0-4 2-7 5-12z"
            fill="#D9A62E"
          />
        </svg>
        <h1 className="font-display text-3xl text-ink mb-2">Birthday Bot</h1>
        <p className="font-body text-ink/60 text-sm mb-8 leading-relaxed">
          Sign in with GitHub to view and add entries in the private{' '}
          <code className="text-ink/80">birthday-bot</code> repo.
        </p>
        <button
          onClick={onSignIn}
          disabled={isSigningIn}
          className="font-body font-semibold w-full bg-ink text-paper rounded-full py-3 px-6 hover:bg-terracotta transition-colors disabled:opacity-50"
        >
          {isSigningIn ? 'Waiting for sign-in…' : 'Sign in with GitHub'}
        </button>
        {error && <p className="text-berry text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
