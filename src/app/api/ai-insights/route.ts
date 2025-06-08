import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { AIInsightsService, BookPriceData } from '@/lib/ai-insights';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'alerts'; // 'alerts' or 'summary'

    // Fetch user's books with pricing data
    const books = await prisma.book.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        isbn: true,
        isbn13: true,
        currentPrice: true,
        purchasePrice: true,
        priceRank: true,
        percentOfHigh: true,
        lastPriceUpdate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (books.length === 0) {
      return NextResponse.json({
        alerts: [],
        summary: null,
        message: 'No books found in your collection'
      });
    }

    // Transform to BookPriceData format
    const bookPriceData: BookPriceData[] = books.map(book => ({
      id: book.id,
      title: book.title,
      isbn: book.isbn || book.isbn13 || '',
      currentPrice: parseFloat(book.currentPrice.toString()),
      purchasePrice: book.purchasePrice ? parseFloat(book.purchasePrice.toString()) : 0,
      priceRank: book.priceRank,
      percentOfHigh: parseFloat(book.percentOfHigh.toString()),
      lastPriceUpdate: book.lastPriceUpdate,
      // TODO: Add price history from a separate table if needed
      priceHistory: []
    }));

    if (type === 'summary') {
      // Generate market summary
      const summary = AIInsightsService.generateMarketSummary(bookPriceData);
      return NextResponse.json({ summary });
    } else {
      // Generate alerts
      const alerts = AIInsightsService.generatePriceAlerts(bookPriceData);
      return NextResponse.json({ alerts });
    }

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save user alert preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertTypes, thresholds, notificationPreferences } = body;

    // Here you could save user preferences to database
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Alert preferences saved successfully',
      preferences: {
        alertTypes,
        thresholds,
        notificationPreferences
      }
    });

  } catch (error) {
    console.error('Error saving alert preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 