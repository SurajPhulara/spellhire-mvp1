'use client';

import ChoiceCards from '@/components/auth/ChoiceCards';

export default function HireIntentPage() {
  return (
    <ChoiceCards
      kicker="Hiring"
      title="Create or join an organization"
      subtitle="New companies start here. If your company already uses SpellHire, find it and sign in as a member."
      choices={[
        {
          href: '/employer/register',
          title: 'Create a new organization',
          description: "You'll become an administrator of this organization and can invite your team next.",
          cta: 'Create organization →',
        },
        {
          href: '/organizations',
          title: 'My organization already exists',
          description: 'Search for your company, view its public page, then sign in as a member. Joining is invitation-only.',
          cta: 'Find organization →',
        },
      ]}
    />
  );
}
