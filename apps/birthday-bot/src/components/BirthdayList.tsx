import { Birthday, formatPretty, sortByCalendar } from '../lib/dates';

export default function BirthdayList({ entries }: { entries: Birthday[] }) {
  const sorted = sortByCalendar(entries);

  return (
    <section>
      <h2 className="font-display text-2xl text-ink mb-4">
        All entries <span className="text-ink/40 text-base font-body">({entries.length})</span>
      </h2>
      <div className="paper-card divide-y divide-ink/10">
        {sorted.map((entry) => (
          <div key={entry.name + entry.date} className="flex items-baseline gap-4 px-5 py-3">
            <span className="font-body text-xs text-ink/40 w-12 shrink-0 tabular-nums">
              {formatPretty(entry.date)}
            </span>
            <span className="font-body font-semibold text-ink shrink-0">{entry.name}</span>
            <span className="font-body text-sm text-ink/50 truncate">{entry.message}</span>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="font-body text-sm text-ink/50 px-5 py-6">No entries yet.</p>
        )}
      </div>
    </section>
  );
}
