interface Props {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

const STEPS = ['Product', 'Quantity', 'Company', 'Shipping', 'Confirm'];

export function OrderProgressTracker({ currentStep, totalSteps, stepLabel }: Props) {
  const steps = STEPS.slice(0, totalSteps);

  return (
    <div className="rounded-lg border border-[#25D366]/20 bg-[#25D366]/5 px-4 py-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-[#25D366]">📦 Order Collection</span>
        <span className="text-[10px] text-muted-foreground">
          Step {currentStep} of {totalSteps}: {stepLabel}
        </span>
      </div>
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 space-y-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i < currentStep
                  ? 'bg-[#25D366]'
                  : i === currentStep
                  ? 'bg-[#25D366]/40'
                  : 'bg-muted'
              }`}
            />
            <p className={`text-[9px] text-center ${i < currentStep ? 'text-[#25D366] font-medium' : 'text-muted-foreground'}`}>
              {s}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
