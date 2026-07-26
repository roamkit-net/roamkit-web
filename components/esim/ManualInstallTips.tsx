import { parseLpa } from "@/lib/esim/lpa";

type ManualInstallTipsProps = {
  lpa?: string | null;
  matchingId?: string | null;
  className?: string;
};

export function ManualInstallTips({
  lpa,
  matchingId,
  className = "",
}: ManualInstallTipsProps) {
  const parsed = lpa ? parseLpa(lpa) : null;
  const smdpAddress = parsed?.smdpAddress ?? "";
  const activationCode =
    (matchingId?.trim() || parsed?.activationCode || "").trim();

  if (!smdpAddress && !activationCode && !parsed?.raw) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-slate-900">
        Manual installation
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        If you cannot scan the QR code, add the eSIM manually in your phone
        settings.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
        <li>Open Settings → Cellular / Mobile Network → Add eSIM (or SIMs).</li>
        <li>Choose Enter details manually (wording varies by device).</li>
        <li>Enter the SM-DP+ address and activation code below.</li>
        <li>Confirm and wait for the eSIM to download.</li>
      </ol>
      <dl className="mt-4 space-y-2 text-sm">
        {smdpAddress ? (
          <div>
            <dt className="text-slate-500">SM-DP+ address</dt>
            <dd className="break-all font-mono text-slate-900">{smdpAddress}</dd>
          </div>
        ) : null}
        {activationCode ? (
          <div>
            <dt className="text-slate-500">Activation code</dt>
            <dd className="break-all font-mono text-slate-900">
              {activationCode}
            </dd>
          </div>
        ) : null}
        {parsed?.raw ? (
          <div>
            <dt className="text-slate-500">Full LPA</dt>
            <dd className="break-all font-mono text-xs text-slate-700">
              {parsed.raw}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
