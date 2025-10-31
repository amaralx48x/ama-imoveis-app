
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // If user is logged in, redirect to their public agent page.
        router.replace(`/corretor/${user.uid}`);
      } else {
        // If no user is logged in, redirect to the login page.
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      <p className="ml-4 text-muted-foreground">Carregando...</p>
    </div>
  );
}
