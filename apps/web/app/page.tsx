import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  Compass,
  FileText,
  MessageCircle,
  Calendar,
  Bell,
  ArrowRight,
  Globe,
} from 'lucide-react';

const features = [
  {
    icon: Compass,
    title: 'Situation Profiler',
    description:
      'Tell us your visa type, city, and goal. We build your roadmap in under 2 minutes.',
  },
  {
    icon: CheckCircle2,
    title: 'Personalised Roadmap',
    description:
      'Every step in the right order, with realistic timelines and dependency tracking.',
  },
  {
    icon: FileText,
    title: 'Document Checklists',
    description:
      'Exact specifications — translations, apostilles, copies, costs. Never show up empty-handed.',
  },
  {
    icon: MessageCircle,
    title: 'AI Guidance Chat',
    description:
      'Ask anything in plain English. Context-aware answers for your visa and Bundesland.',
  },
  {
    icon: Calendar,
    title: 'Form-Filling Guides',
    description:
      'Field-by-field explanations for every official form. No more guessing.',
  },
  {
    icon: Bell,
    title: 'Deadline Alerts',
    description:
      'Visa expiry 90/30/7 day reminders. Statutory deadlines tracked from day one.',
  },
];

const stats = [
  { value: '400K+', label: 'International students in Germany' },
  { value: '300K+', label: 'Skilled workers on non-EU visas' },
  { value: '15–40h', label: 'Lost per person in first 3 months' },
  { value: '16', label: 'Bundesländer with different rules' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/treppd-logo-horizontal.png"
                alt="Treppd"
                width={140}
                height={40}
                className="h-9 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 bg-[#1a365d] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2a4a75] transition-colors"
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1a365d] text-sm font-medium px-3 py-1 rounded-full mb-6">
            <Globe className="w-4 h-4" />
            Built for non-EU immigrants in Germany
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight">
            Navigate Germany.
            <br />
            <span className="text-[#1a365d]">Step by step.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Treppd is your AI-powered bureaucracy co-pilot. Personalised
            roadmaps, form-filling guides, and document checklists — all in
            plain English, tailored to your visa type and city.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#1a365d] text-white text-base font-medium px-6 py-3 rounded-lg hover:bg-[#2a4a75] transition-colors w-full sm:w-auto justify-center"
            >
              Start your roadmap
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-700 text-base font-medium px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Free to start · No credit card required
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50 px-4 sm:px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#1a365d]">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              The bureaucracy is fragmented.
              <br />
              Your roadmap shouldn&apos;t be.
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Rules differ by Bundesland, city, visa type, and nationality. No
              single source covers all combinations. One missing document means
              a 6–12 week appointment rebook.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Official forms are German-only with legal terminology',
              'Steps must be completed in strict order — but nobody tells you which',
              'Conflicting advice from forums, groups, and well-meaning seniors',
              'Certified translations, apostilles, photo specs — all hidden rules',
            ].map((pain) => (
              <div
                key={pain}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl"
              >
                <div className="shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                  ×
                </div>
                <p className="text-gray-700">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-4 sm:px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need in one place
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Six features that together replace dozens of forum searches.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1a365d] flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How it works
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Tell us your situation',
                body: 'Visa type, nationality, city, goal, dates. 2 minutes. Smart defaults skip what does not apply to you.',
              },
              {
                step: '2',
                title: 'Get your personalised roadmap',
                body: 'Verified steps from official sources, enriched by AI with tips and realistic wait times for your specific situation.',
              },
              {
                step: '3',
                title: 'Complete steps in the right order',
                body: 'Track progress, prepare documents, and never miss a deadline. Ask the AI anything along the way.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 sm:gap-6">
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-gray-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 py-20 bg-[#1a365d] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Save your first 40 hours in Germany
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Join the beta. Free for early users. Your roadmap in minutes.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 bg-white text-[#1a365d] text-base font-medium px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Start your roadmap
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Image
              src="/treppd-logo-horizontal.png"
              alt="Treppd"
              width={100}
              height={28}
              className="h-6 w-auto opacity-60"
            />
            <span>&copy; 2026 Treppd</span>
          </div>
          <p className="text-xs text-gray-500 text-center sm:text-right max-w-lg">
            Educational guidance, not legal advice. Always verify details with
            your local Ausländerbehörde.
          </p>
        </div>
      </footer>
    </div>
  );
}
