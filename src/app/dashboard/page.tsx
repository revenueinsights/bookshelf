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
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard"
        description="Welcome to your BookShelf analytics dashboard"
      />
      
      <DashboardStats
        booksCount={booksCount}
        batchesCount={batchesCount}
        greenCount={greenCount}
        yellowCount={yellowCount}
        redCount={redCount}
        totalValue={totalValue}
      />
      
      {booksCount === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/dashboard/scanner"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300 mr-4">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Scan Books</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scan barcodes to add books and check prices
                </p>
              </div>
            </Link>
            
            <Link
              href="/dashboard/batches/create"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="h-12 w-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center text-green-600 dark:text-green-300 mr-4">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Create a Batch</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Organize your books into collections
                </p>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Batches</h2>
            <Link 
              href="/dashboard/batches" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          
          {recentBatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recentBatches.map((batch) => (
                <BatchCard 
                  key={batch.id}
                  id={batch.id}
                  name={batch.name}
                  description={batch.description || ''}
                  booksCount={batch._count.books}
                  greenCount={batch.greenCount}
                  yellowCount={batch.yellowCount}
                  redCount={batch.redCount}
                  updatedAt={batch.updatedAt}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No batches yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
      )}
    </div>
  );
}