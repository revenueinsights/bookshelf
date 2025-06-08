import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BookCondition } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ isbn: string }> }
) {
  try {
    const resolvedParams = await params;
    const { isbn } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition') as BookCondition || BookCondition.GOOD;

    // Find book metadata
    const bookMetadata = await prisma.bookMetadata.findFirst({
      where: {
        OR: [
          { isbn: isbn },
          { isbn13: isbn }
        ]
      },
      include: {
        priceQuotes: {
          where: {
            condition: condition,
            status: 'ACTIVE'
          },
          include: {
            vendor: true
          },
          orderBy: {
            price: 'desc'
          }
        },
        marketData: {
          where: {
            condition: condition
          }
        }
      }
    });

    if (!bookMetadata) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Format the response like BookScouter
    const response = {
      book: {
        isbn: bookMetadata.isbn,
        isbn13: bookMetadata.isbn13,
        title: bookMetadata.title,
        subtitle: bookMetadata.subtitle,
        authors: bookMetadata.authors,
        publisher: bookMetadata.publisher,
        publishedDate: bookMetadata.publishedDate,
        retailPrice: bookMetadata.retailPrice,
        imageUrl: bookMetadata.imageUrl,
        format: bookMetadata.format,
      },
      condition: condition,
      quotes: bookMetadata.priceQuotes.map(quote => ({
        vendor: {
          name: quote.vendor.displayName,
          website: quote.vendor.website,
          rating: quote.vendor.averageRating,
          reviews: quote.vendor.totalReviews,
          processingTime: quote.vendor.processingTime,
          paymentMethods: quote.vendor.paymentMethods,
        },
        price: quote.price,
        totalPayout: quote.totalPayout,
        shippingCost: quote.shippingCost,
        processingFee: quote.processingFee,
        quotedAt: quote.quotedAt,
        expiresAt: quote.expiresAt,
        isHighestPrice: quote.isHighestPrice,
      })),
      marketData: bookMetadata.marketData[0] ? {
        averagePrice: bookMetadata.marketData[0].averagePrice,
        highestPrice: bookMetadata.marketData[0].highestPrice,
        lowestPrice: bookMetadata.marketData[0].lowestPrice,
        priceRange: bookMetadata.marketData[0].priceRange,
        vendorCount: bookMetadata.marketData[0].vendorCount,
        demandScore: bookMetadata.marketData[0].demandScore,
        lastUpdated: bookMetadata.marketData[0].lastUpdated,
      } : null,
      summary: {
        bestPrice: bookMetadata.priceQuotes[0]?.price || 0,
        bestVendor: bookMetadata.priceQuotes[0]?.vendor.displayName || null,
        totalQuotes: bookMetadata.priceQuotes.length,
        priceRange: bookMetadata.marketData[0]?.priceRange || 0,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 