// app/dashboard/batches/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import BatchHeader from '@/components/batches/BatchHeader';
import BatchAnalytics from '@/components/batches/BatchAnalytics';
import BatchBookList from '@/components/batches/BatchBookList';
import RefreshPricesButton from '@/components/batches/RefreshPricesButton';
import ExportBatchButton from '@/components/batches/ExportBatchButton';
import { ArrowLeft, QrCode, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BatchDetailPageProps {
  params: {
    id: string;
  };
}

async function getBatchWithBooks(batchId: string, userId: string) {
  const batch = await prisma.batch.findUnique({
    where: {
      id: batchId,
      userId,
    },
    include: {
      books: true,
    },
  });

  if (!batch) {
    return null;
  }

  // Format the batch data for the frontend
  return {
    ...batch,
    books: batch.books.map(book => ({
      ...book,
      currentPrice: parseFloat(book.currentPrice.toString()),
      historicalHigh: parseFloat(book.historicalHigh.toString()),
      percentOfHigh: parseFloat(book.percentOfHigh.toString()),
      purchasePrice: book.purchasePrice ? parseFloat(book.purchasePrice.toString()) : null,
    })),
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    lastPriceUpdate: batch.lastPriceUpdate?.toISOString() || null,
  };
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const batch = await getBatchWithBooks(params.id, userId);

  if (!batch) {
    notFound();
  }

  // Calculate statistics
  const totalBooks = batch.books.length;
  const greenCount = batch.books.filter(book => book.priceRank === 'GREEN').length;
  const yellowCount = batch.books.filter(book => book.priceRank === 'YELLOW').length;
  const redCount = batch.books.filter(book => book.priceRank === 'RED').length;
  
  const totalValue = batch.books.reduce((sum, book) => sum + book.currentPrice, 0);
  const averagePrice = totalBooks > 0 ? totalValue / totalBooks : 0;
  
  const averagePercent = batch.books.length > 0
    ? batch.books.reduce((sum, book) => sum + book.percentOfHigh, 0) / batch.books.length
    : 0;

  // Find highest valued book
  const highestValuedBook = batch.books.length > 0
  ? (() => {
      const book = batch.books.reduce((prev, current) => 
        (prev.currentPrice > current.currentPrice) ? prev : current
      );
      return {
        id: book.id,
        title: book.title || undefined, // Convert null to undefined
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        historicalHigh: book.historicalHigh,
        percentOfHigh: book.percentOfHigh,
      };
    })()
  : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/batches"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Batches
        </Link>
        
        <div className="flex space-x-2">
          <ExportBatchButton batchId={batch.id} />
          <RefreshPricesButton batchId={batch.id} lastUpdate={batch.lastPriceUpdate} />
          
          <Link
            href={`/dashboard/scanner?batchId=${batch.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <QrCode className="h-4 w-4 mr-1" />
            Scan Books
          </Link>
          
          <Link
            href={`/dashboard/batches/${batch.id}/add-books`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Books
          </Link>
        </div>
      </div>
      

      <BatchHeader
        name={batch.name}
        description={batch.description || ''}
        booksCount={totalBooks}
        lastUpdated={batch.lastPriceUpdate}
        createdAt={batch.createdAt}
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Batch Analytics</h2>
        <BatchAnalytics
          totalBooks={totalBooks}
          greenCount={greenCount}
          yellowCount={yellowCount}
          redCount={redCount}
          totalValue={totalValue}
          averagePrice={averagePrice}
          averagePercent={averagePercent}
          highestValuedBook={highestValuedBook}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Books in this Batch</h2>
        {batch.books.length > 0 ? (
          <BatchBookList books={batch.books} batchId={batch.id} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              This batch doesn't have any books yet. Add some books to get started.
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <Link
                href={`/dashboard/scanner?batchId=${batch.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan Books
              </Link>
              
              <Link
                href={`/dashboard/batches/${batch.id}/add-books`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Books
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}