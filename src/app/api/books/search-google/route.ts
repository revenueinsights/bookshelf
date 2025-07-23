import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      title: string;
      authors?: string[];
      publishedDate?: string;
      description?: string;
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      industryIdentifiers?: Array<{
        type: string;
        identifier: string;
      }>;
      pageCount?: number;
      categories?: string[];
      averageRating?: number;
      ratingsCount?: number;
    };
  }>;
}

// POST - Search Google Books API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Books API key not configured' }, { status: 500 });
    }

    // Search Google Books API
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`Google Books API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to search Google Books' }, { status: 500 });
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ books: [] });
    }

    // Transform the response to match our format
    const books = data.items.map(item => {
      const volumeInfo = item.volumeInfo;
      
      // Extract ISBN from industry identifiers
      let isbn = null;
      if (volumeInfo.industryIdentifiers) {
        const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13');
        const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10');
        isbn = isbn13?.identifier || isbn10?.identifier || null;
      }

      return {
        title: volumeInfo.title,
        authors: volumeInfo.authors || [],
        publishedDate: volumeInfo.publishedDate,
        description: volumeInfo.description,
        thumbnailUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
        imageUrl: volumeInfo.imageLinks?.thumbnail,
        pageCount: volumeInfo.pageCount,
        categories: volumeInfo.categories || [],
        averageRating: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        isbn: isbn,
      };
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 