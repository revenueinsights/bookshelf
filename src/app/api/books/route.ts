// app/api/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { BookCondition, PriceRank } from '@prisma/client';

// GET - Fetch all books or search books
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Search parameters from Bookstore-Manager
    const title = searchParams.get('title') || '';
    const author = searchParams.get('author') || '';
    const year = searchParams.get('year') || '';
    const isbn = searchParams.get('isbn') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    let whereClause: any = { userId: session.user.id };

    if (title || author || year || isbn || search) {
      const searchConditions = [];
      
      if (title) {
        searchConditions.push({ title: { contains: title, mode: 'insensitive' } });
      }
      if (author) {
        searchConditions.push({ 
          authors: { 
            path: '$',
            array_contains: author 
          }
        });
      }
      if (year) {
        const yearInt = parseInt(year);
        if (!isNaN(yearInt)) {
          searchConditions.push({ 
            OR: [
              { createdAt: { gte: new Date(`${yearInt}-01-01`), lt: new Date(`${yearInt + 1}-01-01`) } },
              { updatedAt: { gte: new Date(`${yearInt}-01-01`), lt: new Date(`${yearInt + 1}-01-01`) } }
            ]
          });
        }
      }
      if (isbn) {
        searchConditions.push({
          OR: [
            { isbn: { contains: isbn, mode: 'insensitive' } },
            { isbn13: { contains: isbn, mode: 'insensitive' } }
          ]
        });
      }
      if (search) {
        searchConditions.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { isbn: { contains: search, mode: 'insensitive' } },
            { isbn13: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        });
      }

      if (searchConditions.length > 0) {
        whereClause.OR = searchConditions;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.book.count({ where: whereClause });

    // Get books
    const books = await prisma.book.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        batch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a new book (Bookstore-Manager style)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, author, year, isbn, isbn13, notes, purchasePrice, condition, batchId } = body;

    // Convert condition string to enum value
    const conditionMap: { [key: string]: string } = {
      'New': 'NEW',
      'Like New': 'LIKE_NEW',
      'Very Good': 'VERY_GOOD',
      'Good': 'GOOD',
      'Acceptable': 'ACCEPTABLE',
      'Poor': 'POOR'
    };
    
    const mappedCondition = condition && conditionMap[condition] ? conditionMap[condition] : 'GOOD';

    // Validation
    if (!title || !author) {
      return NextResponse.json(
        { error: 'Title and author are required' },
        { status: 400 }
      );
    }

    // Create the book
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        authors: Array.isArray(author) ? author : [author.trim()],
        isbn: isbn?.trim() || null,
        isbn13: isbn13?.trim() || isbn?.trim() || null,
        notes: notes?.trim() || null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        condition: mappedCondition as any,
        priceRank: PriceRank.YELLOW, // Default
        userId: session.user.id,
        batchId: batchId || null,
        firstTracked: new Date(),
        lastPriceUpdate: new Date()
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a book
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, author, year, isbn, isbn13, notes, purchasePrice, condition, batchId } = body;

    // Convert condition string to enum value
    const conditionMap: { [key: string]: string } = {
      'New': 'NEW',
      'Like New': 'LIKE_NEW',
      'Very Good': 'VERY_GOOD',
      'Good': 'GOOD',
      'Acceptable': 'ACCEPTABLE',
      'Poor': 'POOR'
    };
    
    const mappedCondition = condition && conditionMap[condition] ? conditionMap[condition] : null;

    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Check if book exists and belongs to user
    const existingBook = await prisma.book.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Update the book
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: title?.trim() || existingBook.title,
        authors: author ? (Array.isArray(author) ? author : [author.trim()]) : existingBook.authors,
        isbn: isbn?.trim() || existingBook.isbn,
        isbn13: isbn13?.trim() || existingBook.isbn13,
        notes: notes?.trim() || existingBook.notes,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : existingBook.purchasePrice,
        condition: mappedCondition || existingBook.condition,
        batchId: batchId !== undefined ? batchId : existingBook.batchId,
        updatedAt: new Date()
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a book
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Check if book exists and belongs to user
    const existingBook = await prisma.book.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Delete the book
    await prisma.book.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}