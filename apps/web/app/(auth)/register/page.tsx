'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password') || '';

  async function onSubmit(data: RegisterFormData) {
    setAuthError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    // Supabase (with email confirmation disabled) signs the user in directly.
    // Refresh server session and send them to onboarding.
    router.refresh();
    router.push('/onboarding');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal top bar */}
      <header className="px-4 sm:px-6 py-4 border-b bg-white">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/treppd-logo-horizontal.png"
              alt="Treppd"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Start navigating German bureaucracy with confidence.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...register('email')}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    {...register('password')}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Create a password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}

                {/* Password strength hints */}
                {password.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {passwordRequirements.map((req) => {
                      const passed = req.test(password);
                      return (
                        <li
                          key={req.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            passed ? 'text-green-700' : 'text-gray-500'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              passed ? 'text-green-600' : 'text-gray-300'
                            }`}
                          />
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1a365d] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#2a4a75] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-[#1a365d] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            By creating an account you agree to our educational-use terms.
            Treppd is not legal advice. Data stored in the EU (GDPR).
          </p>
        </div>
      </main>
    </div>
  );
}
