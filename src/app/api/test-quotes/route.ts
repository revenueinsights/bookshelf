import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test basic database connection
    const vendorCount = await prisma.vendor.count();
    const bookMetadataCount = await prisma.bookMetadata.count();
    const quoteCount = await prisma.priceQuote.count();
    
    // Get a sample book with quotes
    const sampleBook = await prisma.bookMetadata.findFirst({
      include: {
        priceQuotes: {
          take: 3,
          include: {
            vendor: true
          }
        }
      }
    });

    return NextResponse.json({
      status: 'success',
      counts: {
        vendors: vendorCount,
        books: bookMetadataCount,
        quotes: quoteCount
      },
      sampleBook: sampleBook ? {
        title: sampleBook.title,
        isbn: sampleBook.isbn,
        quotesCount: sampleBook.priceQuotes.length,
        sampleQuotes: sampleBook.priceQuotes.map(q => ({
          vendor: q.vendor.displayName,
          price: q.price,
          condition: q.condition
        }))
      } : null
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 