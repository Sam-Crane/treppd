import { create } from 'zustand';
import type { ProfileFormData } from '@/lib/schemas/onboarding';

interface OnboardingState {
  step: number;
  formData: Partial<ProfileFormData>;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<ProfileFormData>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 0,
  formData: {},
  setStep: (step) => set({ step }),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  reset: () => set({ step: 0, formData: {} }),
}));
