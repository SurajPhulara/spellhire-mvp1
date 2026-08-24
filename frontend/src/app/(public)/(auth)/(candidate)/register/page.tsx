'use client';

import ChoiceCards from '@/components/auth/ChoiceCards';

export default function RegisterIntentPage() {
  return (
    <ChoiceCards
      kicker="Get started"
      title="What are you looking to do?"
      subtitle="Choose a path. You can always sign in later with the same email."
      choices={[
        {
          href: '/register/job',
          title: 'Looking for a job',
          description: 'Search roles, apply, and track your applications.',
          cta: 'Find a job →',
        },
        {
          href: '/register/hire',
          title: 'Looking to hire',
          description: 'Create or join an organization and manage hiring.',
          cta: 'Hire people →',
        },
      ]}
    />
  );
}
