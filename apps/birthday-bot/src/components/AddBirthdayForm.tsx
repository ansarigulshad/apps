import { FormEvent, useMemo, useState } from 'react';
import { Birthday, isValidMonthDay, toDateString } from '../lib/dates';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EMOJI = ['🎂', '🎉', '🥳', '🎈', '🎊'];

function defaultMessage(name: string) {
  const emoji = EMOJI[Math.floor(Math.random() * EMOJI.length)];
  return `Happy Birthday ${name.trim()}! ${emoji} Wishing you a fantastic year ahead!`;
}

interface Props {
  existing: Birthday[];
  onSubmit: (entry: Birthday) => Promise<void>;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function AddBirthdayForm({ existing, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorText, setErrorText] = useState('');

  const monthNum = Number(month);
  const dayNum = Number(day);

  const validationError = useMemo(() => {
    if (!name.trim()) return 'Name is required.';
    if (!month || !day) return 'Pick a month and day.';
    if (!isValidMonthDay(monthNum, dayNum)) return "That day doesn't exist in that month.";
    const dateStr = toDateString(monthNum, dayNum);
    const dupe = existing.some(
      (e) => e.date === dateStr && e.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (dupe) return 'This name and date are already in birthdays.json.';
    return null;
  }, [name, month, day, monthNum, dayNum, existing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validationError) return;

    setStatus('submitting');
    setErrorText('');
    try {
      await onSubmit({
        name: name.trim(),
        date: toDateString(monthNum, dayNum),
        message: message.trim() || defaultMessage(name),
      });
      setStatus('success');
      setName('');
      setMonth('');
      setDay('');
      setMessage('');
      setTouched(false);
    } catch (err) {
      setStatus('error');
      setErrorText(err instanceof Error ? err.message : 'Something went wrong opening the PR.');
    }
  }

  const daysInMonth = month ? new Date(2024, monthNum, 0).getDate() : 31;

  return (
    <section className="paper-card rise-in p-6" style={{ '--tilt': '0.5deg' } as React.CSSProperties}>
      <h2 className="font-display text-2xl text-ink mb-1">Add a birthday</h2>
      <p className="font-body text-sm text-ink/50 mb-6">Opens a pull request — nothing merges automatically.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-xs font-semibold text-ink/60 uppercase tracking-wide">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="mt-1 w-full font-body bg-paper/60 border border-ink/15 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="font-body text-xs font-semibold text-ink/60 uppercase tracking-wide">Month</label>
            <select
              value={month}
              onChange={(e) => { setMonth(e.target.value); setDay(''); }}
              className="mt-1 w-full font-body bg-paper/60 border border-ink/15 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta"
            >
              <option value="" disabled>Select</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="font-body text-xs font-semibold text-ink/60 uppercase tracking-wide">Day</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              disabled={!month}
              className="mt-1 w-full font-body bg-paper/60 border border-ink/15 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta disabled:opacity-40"
            >
              <option value="" disabled>—</option>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="font-body text-xs font-semibold text-ink/60 uppercase tracking-wide">
            Message <span className="normal-case text-ink/35">(optional — we'll suggest one)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={name ? defaultMessage(name) : 'Happy Birthday …! 🎂'}
            rows={3}
            className="mt-1 w-full font-body bg-paper/60 border border-ink/15 rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta resize-none"
          />
        </div>

        {touched && validationError && (
          <p className="text-berry text-sm font-body">{validationError}</p>
        )}
        {status === 'error' && <p className="text-berry text-sm font-body">{errorText}</p>}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="font-body font-semibold w-full bg-terracotta text-paper rounded-full py-3 hover:bg-ink transition-colors disabled:opacity-50"
        >
          {status === 'submitting' ? 'Opening pull request…' : 'Open pull request'}
        </button>

        {status === 'success' && (
          <p className="font-body text-sage text-sm text-center">Pull request opened — check the banner above ✨</p>
        )}
      </form>
    </section>
  );
}
