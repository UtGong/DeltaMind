type Props = {
  claim: string;
  domain: string;
  loading: boolean;
  exampleClaims: string[];
  onClaimChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onVerify: () => void;
};

export function ClaimInputPanel({
  claim,
  domain,
  loading,
  exampleClaims,
  onClaimChange,
  onDomainChange,
  onVerify,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="text-sm font-medium text-slate-700">Claim or topic</label>

      <textarea
        value={claim}
        onChange={(e) => onClaimChange(e.target.value)}
        className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-4 text-base outline-none focus:border-slate-400"
      />

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <label className="text-sm font-medium text-slate-700">Mode</label>
          <select
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="ml-0 mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2 md:ml-3 md:inline-block"
          >
            <option value="general_web">Mock: General Web</option>
            <option value="gaming_industry">Mock: Gaming Industry</option>
            <option value="real_web">Real Web Search</option>
            <option value="real_gaming">Real Gaming Web Search</option>
          </select>
        </div>

        <button
          onClick={onVerify}
          disabled={loading || claim.trim().length === 0}
          className="rounded-2xl bg-slate-950 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Verifying..." : "Verify Claim"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {exampleClaims.map((item) => (
          <button
            key={item}
            onClick={() => onClaimChange(item)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
