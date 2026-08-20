export default function PrBanner({ url, onDismiss }: { url: string; onDismiss: () => void }) {
  return (
    <div className="rise-in bg-sage text-paper rounded-xl px-5 py-3 flex items-center justify-between gap-4 mb-8">
      <p className="font-body text-sm">
        Pull request opened —{' '}
        <a href={url} target="_blank" rel="noreferrer" className="underline font-semibold">
          review it on GitHub
        </a>
      </p>
      <button onClick={onDismiss} className="font-body text-paper/70 hover:text-paper text-sm">
        Dismiss
      </button>
    </div>
  );
}
