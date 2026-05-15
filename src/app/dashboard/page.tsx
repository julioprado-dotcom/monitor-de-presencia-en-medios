'use client';

import { Suspense } from 'react';
import { NewDashboard } from '@/components/dashboard/NewDashboard';
import { LoadingScreen } from '@/components/dashboard/LoadingScreen';

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <NewDashboard />
    </Suspense>
  );
}
