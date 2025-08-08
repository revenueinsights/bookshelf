// app/dashboard/page.tsx
import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import BatchCard from '@/components/batches/BatchCard';
import { Package, QrCode, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardData(userId: string) {
  // Get counts
  const booksCount = await prisma.book.count({
    where: { userId }
  });
  
  const batchesCount = await prisma.batch.count({
    where: { userId }
  });
  
  // Get price ranking counts
  const greenCount = await prisma.book.count({
    where: { userId, priceRank: 'GREEN' }
  });
  
  const yellowCount = await prisma.book.count({
    where: { userId, priceRank: 'YELLOW' }
  });
  
  const redCount = await prisma.book.count({
    where: { userId, priceRank: 'RED' }
  });
  
  // Calculate total value
  const books = await prisma.book.findMany({
    where: { userId },
    select: { currentPrice: true }
  });
  
  const totalValue = books.reduce(
    (sum, book) => sum + parseFloat(book.currentPrice.toString()), 
    0
  );
  
  // Get recent batches
  const recentBatches = await prisma.batch.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 4,
    include: {
      _count: {
        select: { books: true }
      }
    }
  });
  
  return {
    booksCount,
    batchesCount,
    greenCount,
    yellowCount,
    redCount,
    totalValue,
    recentBatches
  };
}

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return <div>Unauthorized</div>;
  }
  const {
    booksCount,
    batchesCount,
    greenCount,
    yellowCount,
    redCount,
    totalValue,
    recentBatches
  } = await getDashboardData(userId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader title="Dashboard" />
        <DashboardStats 
          booksCount={booksCount}
          batchesCount={batchesCount}
          greenCount={greenCount}
          yellowCount={yellowCount}
          redCount={redCount}
          totalValue={totalValue}
        />
        
        {/* Recent Batches */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="h-6 w-6 text-gray-400 mr-2" />
              Recent Batches
            </h2>
            <Link href="/dashboard/batches" className="text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          
          {recentBatches.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentBatches.map((batch) => (
                <BatchCard 
                  key={batch.id}
                  id={batch.id}
                  name={batch.name}
                  description={batch.description || ''}
                  booksCount={batch._count.books}
                  greenCount={batch.greenCount || 0}
                  yellowCount={batch.yellowCount || 0}
                  redCount={batch.redCount || 0}
                  updatedAt={batch.updatedAt}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No batches yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new batch to organize your books.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/batches/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Batch
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}