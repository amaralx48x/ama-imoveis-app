
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona incondicionalmente para a página de login.
    router.replace('/login');
  }, [router]);

  // Renderiza um loader enquanto o redirecionamento acontece.
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      <p className="ml-4 text-muted-foreground">Carregando...</p>
    </div>
  );
}
