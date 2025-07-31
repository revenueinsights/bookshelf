import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// POST - Refresh prices for a specific book
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.id;

    // Find the book and verify ownership
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: session.user.id
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.isbn) {
      return NextResponse.json({ error: 'Book has no ISBN for price lookup' }, { status: 400 });
    }

    // Call the price lookup API to get fresh data
    const priceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/books/price-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn: book.isbn })
    });

    if (!priceResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch updated prices' }, { status: 500 });
    }

    const priceData = await priceResponse.json();

    // Update the book with new price data
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        currentPrice: priceData.currentPrice || 0,
        historicalHigh: priceData.historicalHigh || 0,
        percentOfHigh: priceData.percentOfHigh || 0,
        priceRank: priceData.priceRank || 'RED',
        bestVendorName: priceData.bestVendorName || null,
        amazonPrice: priceData.amazonPrice || null,
        lastPriceUpdate: new Date()
      }
    });

    return NextResponse.json({
      message: 'Prices refreshed successfully',
      book: updatedBook
    });
  } catch (error) {
    console.error('Error refreshing book prices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 