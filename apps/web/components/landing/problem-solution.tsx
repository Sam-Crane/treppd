import { AlertCircle } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';

const painPoints = [
  'Official forms are German-only with legal terminology',
  'Steps must be completed in strict order — but nobody tells you which',
  'Conflicting advice from forums, groups, and well-meaning seniors',
  'Certified translations, apostilles, photo specs — all hidden rules',
];

export function ProblemSolution() {
  return (
    <section className="bg-white px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-4xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            The bureaucracy is fragmented.
            <br />
            <span className="bg-gradient-to-br from-[#1a365d] to-[#4a73a9] bg-clip-text text-transparent">
              Your roadmap shouldn&apos;t be.
            </span>
          </h2>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Rules differ by Bundesland, city, visa type, and nationality. No
            single source covers all combinations. One missing document means a
            6–12 week appointment rebook.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {painPoints.map((pain, index) => (
            <FadeIn
              key={pain}
              delay={index * 0.1}
              y={16}
              className="flex items-start gap-3 p-5 bg-red-50/70 border border-red-100 rounded-xl"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-gray-700 leading-relaxed pt-0.5">{pain}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
