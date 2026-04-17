'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    num: '01',
    title: 'Tell us your situation',
    body: 'Visa type, Bundesland, goal, arrival date. Takes under a minute.',
  },
  {
    num: '02',
    title: 'Get your roadmap',
    body: 'Claude builds a verified, step-by-step plan in under 10 seconds. No guessing which Anmeldung form applies to Bavaria.',
  },
  {
    num: '03',
    title: 'Upload + ask as you go',
    body: 'Upload passports, scans, transcripts. Ask the assistant anything. Every answer cites its source.',
  },
  {
    num: '04',
    title: 'Never miss a deadline',
    body: 'Push alerts 90, 30, 7 days before visa expiry. 14-day Anmeldung nudge. Phone in your pocket does the remembering.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-border-default bg-base py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            How Treppd works
          </h2>
          <p className="mt-3 text-text-secondary">
            Four steps from signup to &quot;settled in Germany&quot;.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="relative flex gap-5 pb-10 last:pb-0"
            >
              {/* Vertical line */}
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-[20px] top-12 h-full w-px bg-border-default"
                />
              )}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-subtle font-mono text-xs font-semibold text-accent-hover dark:text-accent">
                {step.num}
              </div>
              <div className="pt-0.5">
                <h3 className="text-base font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-1 max-w-md text-sm text-text-secondary">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
