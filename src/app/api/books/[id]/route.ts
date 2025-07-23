import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// GET - Fetch a single book by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.id;

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: session.user.id
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true
          }
        },
        bookMetadata: {
          select: {
            id: true,
            title: true,
            authors: true,
            publisher: true,
            publishedDate: true,
            description: true,
            imageUrl: true,
            categories: true,
            pageCount: true,
            language: true,
            averageRating: true,
            ratingsCount: true
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.id;
    const body = await request.json();
    const { title, author, notes, purchasePrice, condition, batchId } = body;

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

    // Check if book exists and belongs to user
    const existingBook = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: session.user.id
      }
    });

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Update the book
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        title: title?.trim() || existingBook.title,
        authors: author ? (Array.isArray(author) ? author : [author.trim()]) : existingBook.authors,
        notes: notes?.trim() || existingBook.notes,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : existingBook.purchasePrice,
        condition: mappedCondition as any,
        batch: batchId ? {
          connect: { id: batchId }
        } : batchId === null ? {
          disconnect: true
        } : undefined
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true
          }
        },
        bookMetadata: {
          select: {
            id: true,
            title: true,
            authors: true,
            publisher: true,
            publishedDate: true,
            description: true,
            imageUrl: true,
            categories: true,
            pageCount: true,
            language: true,
            averageRating: true,
            ratingsCount: true
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.id;

    // Check if book exists and belongs to user
    const existingBook = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: session.user.id
      }
    });

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Delete the book
    await prisma.book.delete({
      where: { id: bookId }
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