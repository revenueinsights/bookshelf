// app/api/batches/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { stringify } from 'csv-stringify/sync';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const batchId = params.id;
    
    // Get the batch and check if it belongs to the user
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        userId: session.user.id,
      },
      include: {
        books: true,
      },
    });
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    // Format the book data for CSV export
    const books = batch.books.map(book => {
      const currentPrice = book.currentPrice ? parseFloat(book.currentPrice.toString()) : 0;
      const historicalHigh = book.historicalHigh ? parseFloat(book.historicalHigh.toString()) : 0;
      const percentOfHigh = book.percentOfHigh ? parseFloat(book.percentOfHigh.toString()) : 0;
      const purchasePrice = book.purchasePrice ? parseFloat(book.purchasePrice.toString()) : null;
      
      return {
        ISBN: book.isbn,
        ISBN13: book.isbn13 || '',
        Title: book.title || 'Unknown Title',
        Authors: Array.isArray(book.authors) ? book.authors.join(', ') : '',
        CurrentPrice: currentPrice.toFixed(2),
        HistoricalHigh: historicalHigh.toFixed(2),
        PercentOfHigh: percentOfHigh.toFixed(2),
        PriceRank: book.priceRank,
        Vendor: book.bestVendorName || '',
        PurchasePrice: purchasePrice !== null ? purchasePrice.toFixed(2) : '',
        Condition: book.condition || '',
        Notes: book.notes || '',
        LastUpdated: book.lastPriceUpdate ? new Date(book.lastPriceUpdate).toISOString() : '',
        FirstTracked: book.firstTracked ? new Date(book.firstTracked).toISOString() : '',
      };
    });
    
    // Generate the CSV content
    const csvString = stringify(books, {
      header: true,
      columns: [
        'ISBN',
        'ISBN13',
        'Title',
        'Authors',
        'CurrentPrice',
        'HistoricalHigh', 
        'PercentOfHigh',
        'PriceRank',
        'Vendor',
        'PurchasePrice',
        'Condition',
        'Notes',
        'LastUpdated',
        'FirstTracked',
      ],
    });
    
    // Set the filename with the batch name
    const filename = `batch-${batch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Create a response with the CSV content
    const response = new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error exporting batch CSV:', error);
    return NextResponse.json({ error: 'Failed to export batch data' }, { status: 500 });
  }
}
