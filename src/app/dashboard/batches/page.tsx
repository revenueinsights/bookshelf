// app/dashboard/batches/page.tsx
import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import BatchCard from '@/components/batches/BatchCard';
import { Package, Plus, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BatchesPageProps {
  searchParams?: {
    query?: string;
  };
}

async function getBatches(userId: string, searchQuery?: string) {
  let whereClause: any = { userId };

  // Add search filter if query is provided
  if (searchQuery) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  const batches = await prisma.batch.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { books: true },
      },
    },
  });

  return batches;
}

export default async function BatchesPage({ searchParams }: BatchesPageProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams?.query || '';
  const batches = await getBatches(userId, searchQuery);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Batches"
        description="Organize your books into collections for analysis"
        actions={
          <Link
            href="/dashboard/batches/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Link>
        }
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {/* Search Form */}
        <form className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="query"
              defaultValue={searchQuery}
              placeholder="Search batches..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {batches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
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
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No batches found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? `No batches match your search query "${searchQuery}"`
                : 'Get started by creating a new batch to organize your books.'}
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
  );
}