import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getProfileData } from '@/app/actions/profile';
import { ProfileView } from '@/components/profile/profile-view';
import { GiftCardFormSkeleton } from '@/components/gift-cards/gift-card-skeleton';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mi Perfil · SIGE Mercado',
  description: 'Gestiona tu cuenta, tienda y configuración personal en SIGE.',
};

async function ProfileContent() {
  const data = await getProfileData();
  if (!data) redirect('/auth/login');
  return <ProfileView data={data} />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="h-56 bg-muted rounded-b-[2.5rem]" />
      <div className="max-w-2xl mx-auto px-4 -mt-2 space-y-4 pt-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card rounded-2xl border" />
          ))}
        </div>
        {/* Cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-card rounded-3xl border" />
        ))}
      </div>
    </div>
  );
}
