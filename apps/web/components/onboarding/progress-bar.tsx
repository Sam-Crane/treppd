'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentStep ? 'bg-[#1a365d]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
