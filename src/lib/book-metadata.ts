// src/lib/book-metadata.ts
import { prisma } from '@/lib/db';

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

/**
 * Fetch book metadata from Google Books API
 */
export async function fetchBookMetadata(isbn: string): Promise<any> {
  try {
    console.log(`Fetching metadata for ISBN: ${isbn}`);
    
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
      console.error('Google Books API key not found in environment variables');
      return null;
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;
    console.log(`Making request to: ${url.replace(apiKey, '***')}`);

    const response = await fetch(url);

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`Google Books API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: GoogleBooksResponse = await response.json();
    console.log(`Response data:`, JSON.stringify(data, null, 2));

    if (!data.items || data.items.length === 0) {
      console.log('No books found for this ISBN');
      return null;
    }

    const bookInfo = data.items[0].volumeInfo;
    console.log('Book info found:', bookInfo.title);
    
    return {
      title: bookInfo.title,
      authors: bookInfo.authors || [],
      publishedDate: bookInfo.publishedDate,
      description: bookInfo.description,
      thumbnailUrl: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail,
      imageUrl: bookInfo.imageLinks?.thumbnail,
      pageCount: bookInfo.pageCount,
      categories: bookInfo.categories || [],
      averageRating: bookInfo.averageRating,
      ratingsCount: bookInfo.ratingsCount,
      isbn: isbn,
      isbn13: isbn.length === 13 ? isbn : null,
    };
  } catch (error) {
    console.error('Error fetching book metadata:', error);
    return null;
  }
}

/**
 * Create or update book metadata in database
 */
export async function createOrUpdateBookMetadata(isbn: string, metadata: any) {
  try {
    const existingMetadata = await prisma.bookMetadata.findUnique({
      where: { isbn }
    });

    if (existingMetadata) {
      // Update existing metadata
      return await prisma.bookMetadata.update({
        where: { isbn },
        data: {
          title: metadata.title,
          authors: metadata.authors,
          publishedDate: metadata.publishedDate,
          description: metadata.description,
          thumbnailUrl: metadata.thumbnailUrl,
          imageUrl: metadata.imageUrl,
          pageCount: metadata.pageCount,
          categories: metadata.categories,
          averageRating: metadata.averageRating,
          ratingsCount: metadata.ratingsCount,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new metadata
      return await prisma.bookMetadata.create({
        data: {
          isbn: metadata.isbn,
          isbn13: metadata.isbn13,
          title: metadata.title,
          authors: metadata.authors,
          publishedDate: metadata.publishedDate,
          description: metadata.description,
          thumbnailUrl: metadata.thumbnailUrl,
          imageUrl: metadata.imageUrl,
          pageCount: metadata.pageCount,
          categories: metadata.categories,
          averageRating: metadata.averageRating,
          ratingsCount: metadata.ratingsCount,
        }
      });
    }
  } catch (error) {
    console.error('Error creating/updating book metadata:', error);
    throw error;
  }
}

/**
 * Fetch and store book metadata for a given ISBN
 */
export async function fetchAndStoreBookMetadata(isbn: string) {
  try {
    // Check if metadata already exists
    const existingMetadata = await prisma.bookMetadata.findUnique({
      where: { isbn }
    });

    if (existingMetadata) {
      return existingMetadata;
    }

    // Fetch from Google Books API
    const metadata = await fetchBookMetadata(isbn);
    
    if (!metadata) {
      return null;
    }

    // Store in database
    return await createOrUpdateBookMetadata(isbn, metadata);
  } catch (error) {
    console.error('Error fetching and storing book metadata:', error);
    return null;
  }
} 