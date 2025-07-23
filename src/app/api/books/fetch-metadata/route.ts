import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { fetchAndStoreBookMetadata } from '@/lib/book-metadata';

// POST - Fetch metadata for books without metadata
export async function POST(request: NextRequest) {
  try {
    console.log('Fetch metadata API called');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    const body = await request.json();
    const { bookId } = body;
    console.log('Request body:', { bookId });

    if (bookId) {
      // Fetch metadata for specific book
      console.log('Fetching metadata for specific book:', bookId);
      
      const book = await prisma.book.findFirst({
        where: { id: bookId, userId: session.user.id },
        include: { bookMetadata: true }
      });

      if (!book) {
        console.log('Book not found');
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }

      if (book.bookMetadata) {
        console.log('Book already has metadata');
        return NextResponse.json({ message: 'Book already has metadata', metadata: book.bookMetadata });
      }

      if (!book.isbn) {
        console.log('Book has no ISBN');
        return NextResponse.json({ error: 'Book has no ISBN to fetch metadata' }, { status: 400 });
      }

      console.log('Fetching metadata for ISBN:', book.isbn);
      const metadata = await fetchAndStoreBookMetadata(book.isbn);
      
      if (!metadata) {
        console.log('No metadata found for ISBN:', book.isbn);
        return NextResponse.json({ error: 'Could not fetch metadata for this book' }, { status: 404 });
      }

      console.log('Metadata fetched successfully, updating book');
      // Update book with metadata reference
      await prisma.book.update({
        where: { id: bookId },
        data: { bookMetadataId: metadata.id }
      });

      return NextResponse.json({ 
        message: 'Metadata fetched successfully', 
        metadata 
      });
    } else {
      // Fetch metadata for all books without metadata
      console.log('Fetching metadata for all books without metadata');
      
      const allBooks = await prisma.book.findMany({
        where: {
          userId: session.user.id,
        },
        select: { id: true, isbn: true, title: true, bookMetadataId: true }
      });

      const booksWithoutMetadata = allBooks.filter(book => 
        !book.bookMetadataId && book.isbn !== null
      );

      console.log(`Found ${booksWithoutMetadata.length} books without metadata`);

      const results = [];
      for (const book of booksWithoutMetadata) {
        try {
          console.log(`Processing book: ${book.title} (ISBN: ${book.isbn})`);
          const metadata = await fetchAndStoreBookMetadata(book.isbn!);
          if (metadata) {
            await prisma.book.update({
              where: { id: book.id },
              data: { bookMetadataId: metadata.id }
            });
            results.push({ bookId: book.id, success: true, metadata });
            console.log(`Successfully processed book: ${book.title}`);
          } else {
            results.push({ bookId: book.id, success: false, error: 'No metadata found' });
            console.log(`No metadata found for book: ${book.title}`);
          }
        } catch (error) {
          console.error(`Error processing book ${book.title}:`, error);
          results.push({ bookId: book.id, success: false, error: 'Failed to fetch metadata' });
        }
      }

      console.log(`Processing complete. Results:`, results);

      return NextResponse.json({
        message: `Processed ${booksWithoutMetadata.length} books`,
        results
      });
    }
  } catch (error) {
    console.error('Error in fetch metadata API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 