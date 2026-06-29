'use client';

import { Quote } from 'lucide-react';

import { FadeIn } from '@/components/motion/fade-in';

interface Testimonial {
  quote: string;
  name: string;
  detail: string;
}

// Real quotes from our user-research interviews with non-EU students in Germany.
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Following the correct sequence is not always easy. You want reassurance you haven’t missed a step.',
    name: 'Artug',
    detail: 'MSc student · from Turkey',
  },
  {
    quote:
      'The forms from the Ausländerbehörde were always confusing — the language was very formal and unfamiliar.',
    name: 'Elham',
    detail: 'former international student · from Iran',
  },
  {
    quote:
      'If an app gave me clear guidance on exactly what to do, I would use it.',
    name: 'Basel',
    detail: 'now working in Germany · from Israel',
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-border-default bg-base py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            From our interviews
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            We asked international students what went wrong.
          </h2>
          <p className="mt-3 text-text-secondary">
            The pattern was the same: scattered information, German-only forms,
            and never being sure you’ve done things in the right order.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-border-default bg-surface p-6 shadow-xs">
                <Quote className="h-7 w-7 text-accent/40" aria-hidden />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-text-primary">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-border-default pt-4">
                  <span className="block text-sm font-semibold text-text-primary">
                    {t.name}
                  </span>
                  <span className="block text-xs text-text-muted">
                    {t.detail}
                  </span>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
