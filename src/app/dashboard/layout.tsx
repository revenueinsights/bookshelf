// app/dashboard/layout.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col ml-0 md:ml-64 min-h-screen">
        <Navbar user={session.user} />
        <main className="flex-1 p-4 md:p-6 mx-auto max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}