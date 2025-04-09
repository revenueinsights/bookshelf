// app/api/books/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const batchId = searchParams.get('batchId');
    const searchTerm = searchParams.get('search');
    const priceRank = searchParams.get('priceRank');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    
    // Build the query
    const query: any = {
      where: {
        userId: session.user.id,
      },
      orderBy: {
        lastPriceUpdate: 'desc' as const,
      },
    };
    
    // Apply filters if provided
    if (batchId) {
      query.where.batchId = batchId;
    }
    
    if (searchTerm) {
      query.where.OR = [
        { isbn: { contains: searchTerm, mode: 'insensitive' as const } },
        { isbn13: { contains: searchTerm, mode: 'insensitive' as const } },
        { title: { contains: searchTerm, mode: 'insensitive' as const } },
        { authors: { array_contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }
    
    if (priceRank) {
      query.where.priceRank = priceRank;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.where.currentPrice = {};
      
      if (minPrice !== undefined) {
        query.where.currentPrice.gte = minPrice;
      }
      
      if (maxPrice !== undefined) {
        query.where.currentPrice.lte = maxPrice;
      }
    }
    
    // Get the batch names for lookup
    const batches = await prisma.batch.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });
    
    // Create a map of batch IDs to names for easy lookup
    const batchMap = new Map(batches.map(batch => [batch.id, batch.name]));
    
    // Get books without batch include to avoid the error
    const books = await prisma.book.findMany(query);
    
    // Format the book data for CSV export
    const formattedBooks = books.map(book => {
      const currentPrice = book.currentPrice ? parseFloat(book.currentPrice.toString()) : 0;
      const historicalHigh = book.historicalHigh ? parseFloat(book.historicalHigh.toString()) : 0;
      const percentOfHigh = book.percentOfHigh ? parseFloat(book.percentOfHigh.toString()) : 0;
      const purchasePrice = book.purchasePrice ? parseFloat(book.purchasePrice.toString()) : null;
      
      // Look up batch name from the map
      const batchName = book.batchId ? batchMap.get(book.batchId) || '' : '';
      
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
        Batch: batchName,
        LastUpdated: book.lastPriceUpdate ? new Date(book.lastPriceUpdate).toISOString() : '',
        FirstTracked: book.firstTracked ? new Date(book.firstTracked).toISOString() : '',
      };
    });
    
    // Generate the CSV content
    const csvString = stringify(formattedBooks, {
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
        'Batch',
        'LastUpdated',
        'FirstTracked',
      ],
    });
    
    // Create a filename
    const filename = `books-export-${new Date().toISOString().split('T')[0]}.csv`;
    
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
    console.error('Error exporting books CSV:', error);
    return NextResponse.json({ error: 'Failed to export books data' }, { status: 500 });
  }
}