import type { VerifyResponse } from "@/types/verification";

type Props = {
  result: VerifyResponse;
  score: number;
  label: string;
  onExport: () => void;
};

export function OverallResultCard({ result, score, label, onExport }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Verification Result
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{label}</h2>
          <p className="mt-3 max-w-4xl text-slate-600">{result.explanation}</p>

          {result.ledger_summary && (
            <p className="mt-4 max-w-4xl rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-900">Ledger summary: </span>
              {result.ledger_summary}
            </p>
          )}

          <button
            onClick={onExport}
            className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export Markdown Report
          </button>
        </div>

        <div className="rounded-3xl bg-slate-950 p-6 text-center text-white">
          <p className="text-sm text-slate-300">Trust Index</p>
          <p className="mt-2 text-6xl font-semibold">{score}</p>
          <p className="mt-1 text-sm text-slate-300">{label}</p>
        </div>
      </div>
    </div>
  );
}
