// src/app/api/books/price-history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchHistoricalPriceData } from '@/lib/book-scouter';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isbn = searchParams.get('isbn');

  if (!isbn) {
    return NextResponse.json({ error: 'ISBN parameter is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const priceHistory = await fetchHistoricalPriceData(isbn, userId);
    
    return NextResponse.json(priceHistory);
  } catch (error: any) {
    console.error("Error fetching price history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}