import {
  Compass,
  CheckCircle2,
  FileText,
  MessageCircle,
  Calendar,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerContainer } from '@/components/motion/stagger-container';
import { StaggerItem } from '@/components/motion/stagger-item';
import { GlassmorphicCard } from '@/components/landing/glassmorphic-card';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
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

export function FeatureGrid() {
  return (
    <section className="bg-gray-50 px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Everything you need in one place
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Six features that together replace dozens of forum searches.
          </p>
        </FadeIn>

        <StaggerContainer
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          staggerChildren={0.08}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title} className="h-full">
                <GlassmorphicCard className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a365d]/10 to-[#4a73a9]/10 text-[#1a365d] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </GlassmorphicCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
