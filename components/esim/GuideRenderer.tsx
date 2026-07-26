type GuideRendererStep = {
  title?: string;
  body: string;
};

type GuideRendererProps = {
  title: string;
  steps: GuideRendererStep[];
  className?: string;
};

/** Generic install guide renderer — no OEM branching. */
export function GuideRenderer({
  title,
  steps,
  className = "",
}: GuideRendererProps) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        {steps.map((step, index) => (
          <li key={`${index}-${step.body.slice(0, 24)}`}>
            {step.title ? (
              <span className="font-medium text-slate-900">{step.title}: </span>
            ) : null}
            {step.body}
          </li>
        ))}
      </ol>
    </div>
  );
}
