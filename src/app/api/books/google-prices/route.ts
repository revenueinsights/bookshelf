// app/api/books/google-prices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET - Fetch Google Books prices for user's books
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const isbn = searchParams.get('isbn');

    if (!bookId && !isbn) {
      return NextResponse.json(
        { error: 'Book ID or ISBN is required' },
        { status: 400 }
      );
    }

    let targetIsbn = isbn;
    
    // If bookId is provided, get the ISBN from the book
    if (bookId) {
      const book = await prisma.book.findFirst({
        where: { id: bookId, userId: session.user.id },
        select: { isbn: true, isbn13: true }
      });
      
      if (!book) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        );
      }
      
      targetIsbn = book.isbn13 || book.isbn;
    }

    if (!targetIsbn) {
      return NextResponse.json(
        { error: 'No ISBN found for this book' },
        { status: 400 }
      );
    }

    // Fetch Google Books price data
    const googlePriceData = await fetchGoogleBooksPrice(targetIsbn);

    return NextResponse.json({
      isbn: targetIsbn,
      googlePrice: googlePriceData.price,
      currency: googlePriceData.currency,
      availability: googlePriceData.availability,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Google Books price:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Fetch Google Books prices for multiple books
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookIds } = body;

    if (!bookIds || !Array.isArray(bookIds)) {
      return NextResponse.json(
        { error: 'Book IDs array is required' },
        { status: 400 }
      );
    }

    // Get books with ISBNs
    const books = await prisma.book.findMany({
      where: { 
        id: { in: bookIds },
        userId: session.user.id 
      },
      select: { 
        id: true, 
        isbn: true, 
        isbn13: true,
        title: true 
      }
    });

    const priceResults = [];

    for (const book of books) {
      const isbn13 = book.isbn13;
      const isbn10 = book.isbn;
      
      let googlePriceData = null;
      let usedIsbn = null;
      
      // Try ISBN-13 first, then ISBN-10 if available
      if (isbn13) {
        try {
          googlePriceData = await fetchGoogleBooksPrice(isbn13);
          usedIsbn = isbn13;
        } catch (error) {
          console.error(`Error fetching price for ISBN-13 ${isbn13}:`, error);
        }
      }
      
      // If ISBN-13 failed or unavailable, try ISBN-10
      if (!googlePriceData && isbn10 && isbn10 !== isbn13) {
        try {
          googlePriceData = await fetchGoogleBooksPrice(isbn10);
          usedIsbn = isbn10;
        } catch (error) {
          console.error(`Error fetching price for ISBN-10 ${isbn10}:`, error);
        }
      }
      
      // If still no data, create a default response
      if (!googlePriceData) {
        googlePriceData = {
          price: null,
          currency: 'USD',
          availability: 'unavailable'
        };
        usedIsbn = isbn13 || isbn10;
      }
      
      priceResults.push({
        bookId: book.id,
        isbn: usedIsbn,
        title: book.title,
        googlePrice: googlePriceData.price,
        currency: googlePriceData.currency,
        availability: googlePriceData.availability,
        lastUpdated: new Date().toISOString()
      });
    }

    return NextResponse.json({ results: priceResults });

  } catch (error) {
    console.error('Error fetching Google Books prices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to fetch Google Books price data
async function fetchGoogleBooksPrice(isbn: string) {
  try {
    // Google Books API endpoint
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        price: null,
        currency: 'USD',
        availability: 'unavailable'
      };
    }

    const book = data.items[0];
    const saleInfo = book.saleInfo;

    // Check if the book is available for purchase
    if (saleInfo && saleInfo.saleability === 'FOR_SALE' && saleInfo.listPrice) {
      return {
        price: saleInfo.listPrice.amount,
        currency: saleInfo.listPrice.currencyCode,
        availability: 'available'
      };
    } else if (saleInfo && saleInfo.saleability === 'FOR_SALE' && saleInfo.retailPrice) {
      return {
        price: saleInfo.retailPrice.amount,
        currency: saleInfo.retailPrice.currencyCode,
        availability: 'available'
      };
    } else if (saleInfo && saleInfo.saleability === 'FREE') {
      return {
        price: 0,
        currency: 'USD',
        availability: 'free'
      };
    } else if (saleInfo && saleInfo.saleability === 'NOT_FOR_SALE') {
      return {
        price: null,
        currency: 'USD',
        availability: 'not_for_sale'
      };
    } else {
      return {
        price: null,
        currency: 'USD',
        availability: 'unavailable'
      };
    }

  } catch (error) {
    console.error('Error fetching from Google Books API:', error);
    return {
      price: null,
      currency: 'USD',
      availability: 'error'
    };
  }
} 