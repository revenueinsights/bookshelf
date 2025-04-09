// src/app/api/books/highest-price/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { fetchHistoricalHighPrice } from '@/lib/book-scouter';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isbn = searchParams.get('isbn');

  if (!isbn) {
    return NextResponse.json({ error: 'ISBN parameter is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const highestPriceData = await fetchHistoricalHighPrice(isbn, userId);

    // If we found a highest price, update the book in the database if it exists
    if (highestPriceData && highestPriceData.maxPrice > 0) {
      try {
        // Check if the book exists in our database
        const existingBook = await prisma.book.findFirst({
          where: {
            OR: [
              { isbn: isbn },
              { isbn13: isbn }
            ]
          }
        });

        // If the book exists and the new historical high is higher than what's stored
        if (existingBook) {
          const currentHistoricalHigh = Number(existingBook.historicalHigh) || 0;
          
          // Only update if the new price is higher than the stored one
          if (highestPriceData.maxPrice > currentHistoricalHigh) {
            // Calculate percentOfHigh safely
            const currentPrice = typeof existingBook.currentPrice === 'number' 
              ? existingBook.currentPrice 
              : parseFloat(existingBook.currentPrice as unknown as string) || 0;
            
            const percentOfHigh = highestPriceData.maxPrice > 0 
              ? (currentPrice / highestPriceData.maxPrice) * 100 
              : 0;
              
            await prisma.book.update({
              where: { id: existingBook.id },
              data: { 
                historicalHigh: highestPriceData.maxPrice,
                percentOfHigh: percentOfHigh,
              }
            });
            
            console.log(`Updated historical high for book ${isbn} to ${highestPriceData.maxPrice}`);
          }
        }
      } catch (dbError) {
        // Log the database error but don't fail the request
        console.error("Error updating book record:", dbError);
      }
    }

    return NextResponse.json(highestPriceData);
  } catch (error: any) {
    console.error("Error fetching highest price:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}