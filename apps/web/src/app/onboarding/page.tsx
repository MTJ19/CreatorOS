import type { Metadata } from 'next';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata: Metadata = {
  title: 'Set Up Your Profile — CreatorOS',
  description: 'Complete your CreatorOS creator profile to start managing brand deals.',
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
