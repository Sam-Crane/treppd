export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-6 p-8">
        <h1 className="text-2xl font-bold text-center">Tell us about your situation</h1>
        <p className="text-center text-gray-500">
          We&apos;ll create a personalised roadmap for your immigration journey.
        </p>
        {/* TODO: Situation Profiler multi-step form */}
      </div>
    </div>
  );
}
