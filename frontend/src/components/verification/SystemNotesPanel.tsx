export function SystemNotesPanel({ notes }: { notes?: string[] }) {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">System Notes</h3>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
        {notes.map((note) => (
          <li key={note}>• {note}</li>
        ))}
      </ul>
    </div>
  );
}
