export function SectionLabel({ children }: { children: string }) {
  return (
    <div className="pt-2">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
        {children}
      </p>
    </div>
  );
}
