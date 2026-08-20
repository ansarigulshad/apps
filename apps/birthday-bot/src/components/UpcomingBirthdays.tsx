import { Birthday, daysUntilNext, formatPretty, relativeLabel, sortByUpcoming } from '../lib/dates';

const ACCENTS = ['bg-terracotta', 'bg-gold', 'bg-sage', 'bg-berry'];

export default function UpcomingBirthdays({ entries }: { entries: Birthday[] }) {
  const upcoming = sortByUpcoming(entries).slice(0, 5);

  return (
    <section>
      <h2 className="font-display text-2xl text-ink mb-4">Upcoming</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {upcoming.map((entry, i) => {
          const days = daysUntilNext(entry.date);
          return (
            <div
              key={entry.name + entry.date}
              className="paper-card rise-in shrink-0 w-44 p-4"
              style={{ '--tilt': `${i % 2 === 0 ? -1.5 : 1.5}deg`, animationDelay: `${i * 60}ms` } as React.CSSProperties}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${ACCENTS[i % ACCENTS.length]} mb-3`} />
              <p className="font-display text-lg text-ink leading-tight">{entry.name}</p>
              <p className="font-body text-xs text-ink/50 mt-1">{formatPretty(entry.date)}</p>
              <p className="font-body text-xs font-semibold text-terracotta mt-2">
                {relativeLabel(days)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
