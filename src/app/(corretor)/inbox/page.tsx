
'use client';
import React from 'react';
import { useUser } from '@/firebase';
import LeadsPage from '@/components/leads-page';

export default function InboxPage() {
    const { user } = useUser();

    if (!user) {
        return (
             <div className="flex items-center justify-center h-64">
                <p>Carregando...</p>
            </div>
        )
    }

    return <LeadsPage agentId={user.uid} />;
}
