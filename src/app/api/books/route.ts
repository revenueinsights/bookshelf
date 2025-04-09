// app/api/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { PriceRank } from '@prisma/client';

// GET /api/books - Get all books with filtering options
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    
    // Filtering options
    const search = searchParams.get('search') || '';
    const batchId = searchParams.get('batchId') || undefined;
    const priceRank = searchParams.get('priceRank') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Calculate offset
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause: any = {
      userId: session.user.id
    };
    
    // Add batch filter if provided
    if (batchId) {
      if (batchId === 'none') {
        whereClause.batchId = null;
      } else {
        whereClause.batchId = batchId;
      }
    }
    
    // Add price rank filter if provided
    if (priceRank) {
      if (priceRank === 'GREEN,YELLOW,RED') {
        // No filter needed, include all
      } else if (priceRank.includes(',')) {
        // Multiple ranks
        const ranks = priceRank.split(',');
        whereClause.priceRank = {
          in: ranks as PriceRank[]
        };
      } else {
        // Single rank
        whereClause.priceRank = priceRank as PriceRank;
      }
    }
    
    // Add price range filter if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.currentPrice = {};
      
      if (minPrice !== undefined) {
        whereClause.currentPrice.gte = minPrice;
      }
      
      if (maxPrice !== undefined) {
        whereClause.currentPrice.lte = maxPrice;
      }
    }
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { isbn13: { contains: search, mode: 'insensitive' } },
        { authors: { array_contains: search, mode: 'insensitive' } },
        { condition: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Determine sort order
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get total count for pagination
    const totalCount = await prisma.book.count({
      where: whereClause,
    });
    
    // Get books with filters, sorting, and pagination
    const books = await prisma.book.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      include: {
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Return books with pagination info
    return NextResponse.json({
      books,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch books', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/books - Delete multiple books
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { bookIds } = body;
    
    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'Book IDs are required' }, { status: 400 });
    }
    
    // Check if all books belong to the user
    const booksToDelete = await prisma.book.findMany({
      where: {
        id: { in: bookIds },
        userId: session.user.id,
      },
    });
    
    if (booksToDelete.length !== bookIds.length) {
      return NextResponse.json({ error: 'One or more books not found or do not belong to you' }, { status: 404 });
    }
    
    // Group books by batch for batch statistics updates
    const batchBooks: Record<string, typeof booksToDelete> = {};
    
    for (const book of booksToDelete) {
      if (book.batchId) {
        if (!batchBooks[book.batchId]) {
          batchBooks[book.batchId] = [];
        }
        batchBooks[book.batchId].push(book);
      }
    }
    
    // Delete books
    await prisma.book.deleteMany({
      where: {
        id: { in: bookIds },
        userId: session.user.id,
      },
    });
    
    // Update batch statistics for affected batches
    for (const [batchId, books] of Object.entries(batchBooks)) {
      // Get remaining books in batch
      const remainingBooks = await prisma.book.findMany({
        where: { batchId },
      });
      
      let greenCount = 0;
      let yellowCount = 0;
      let redCount = 0;
      let totalValue = 0;
      let highestPrice = 0;
      let highestPriceISBN = '';
      let sumPercent = 0;
      
      remainingBooks.forEach(book => {
        if (book.priceRank === PriceRank.GREEN) greenCount++;
        else if (book.priceRank === PriceRank.YELLOW) yellowCount++;
        else redCount++;
        
        const bookPrice = parseFloat(book.currentPrice.toString());
        totalValue += bookPrice;
        
        if (bookPrice > highestPrice) {
          highestPrice = bookPrice;
          highestPriceISBN = book.isbn;
        }
        
        sumPercent += parseFloat(book.percentOfHigh.toString());
      });
      
      const totalBooks = remainingBooks.length;
      const averagePercent = totalBooks > 0 ? sumPercent / totalBooks : 0;
      
      // Update batch statistics
      await prisma.batch.update({
        where: { id: batchId },
        data: {
          greenCount,
          yellowCount,
          redCount,
          totalBooks,
          totalValue,
          averagePercent,
          highestPrice: highestPrice || null,
          highestPriceISBN: highestPriceISBN || null,
          updatedAt: new Date(),
        },
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${bookIds.length} book(s) deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting books:', error);
    return NextResponse.json({ 
      error: 'Failed to delete books', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}