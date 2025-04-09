// src/app/api/books/price-lookup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { PriceRank } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  fetchBookPrice, 
  fetchHistoricalHighPrice, 
  fetchMostRecentHistoricalPrice 
} from '@/lib/book-scouter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { isbn } = body;
    
    if (!isbn || typeof isbn !== 'string' || isbn.trim() === '') {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 });
    }

    // Clean ISBN
    const cleanIsbn = isbn.trim().replace(/-/g, '');
    
    // Try to find the book in our database first
    const existingBook = await prisma.book.findFirst({
      where: {
        OR: [
          { isbn: cleanIsbn },
          { isbn13: cleanIsbn }
        ],
        userId: session.user.id
      }
    });
    
    // Get user settings for threshold values
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    }) || {
      greenThreshold: new Decimal(50),
      yellowThreshold: new Decimal(1)
    };
    
    // Using our new utility function to get book price data
    const bookScouterData = await fetchBookPrice(cleanIsbn, userId);
    
    if (!bookScouterData) {
      return NextResponse.json({ error: 'Failed to fetch book data' }, { status: 500 });
    }
    
    // Get historical high price data
    const historicalHighData = await fetchHistoricalHighPrice(cleanIsbn, userId);
    
    // Check if current price equals Amazon price and correct it if possible
    if (bookScouterData.priceEqualsAmazon) {
      // If current price equals Amazon price, get the most recent price from history
      const recentPrice = await fetchMostRecentHistoricalPrice(cleanIsbn, userId);
      
      if (recentPrice && recentPrice.price > 0) {
        // Set a more accurate current price instead of the Amazon price
        bookScouterData.currentPrice = recentPrice.price;
        
        // Update best vendor information if available
        if (recentPrice.vendor) {
          bookScouterData.bestVendorName = recentPrice.vendor;
        }
      }
    }
    
    // Extract needed data from API response
    const {
      currentPrice,
      amazonPrice,
      bestVendorName,
      title,
      authors,
      isbn10,
      isbn13,
      publisher,
      publishedDate,
      description,
      imageUrl
    } = bookScouterData;

    // Handle price history
    let priceHistory = [];
    let amazonPriceHistory = [];
    
    // Set historical high price - use API value if available, otherwise fallback to current price
    let historicalHigh = historicalHighData ? historicalHighData.maxPrice : currentPrice;
    
    // Calculate percentage of historical high
    let percentOfHigh = 100; // Default to 100% if no historical data
    if (historicalHigh > 0) {
      percentOfHigh = (Number(currentPrice) / Number(historicalHigh)) * 100;
    }
    
    // Determine price rank based on user settings
    let priceRank: PriceRank = PriceRank.GREEN;
    if (percentOfHigh >= userSettings.greenThreshold.toNumber()) {
      priceRank = PriceRank.GREEN;
    } else if (percentOfHigh >= userSettings.yellowThreshold.toNumber()) {
      priceRank = PriceRank.YELLOW;
    } else {
      priceRank = PriceRank.RED;
    }
    
    // Process existing book data if available
    if (existingBook) {
      // Parse existing price history
      try {
        // Process regular price history
        const existingPriceHistoryJson = existingBook.priceHistory as any || '[]';
        priceHistory = JSON.parse(
          typeof existingPriceHistoryJson === 'string' 
            ? existingPriceHistoryJson 
            : JSON.stringify(existingPriceHistoryJson)
        );
        
        // Add current price to history
        const newPriceEntry = {
          vendorName: bestVendorName || 'Unknown',
          price: Number(currentPrice),
          timestamp: new Date().toISOString()
        };
        
        priceHistory.push(newPriceEntry);
        
        // Process Amazon price history if available
        if (amazonPrice) {
          const existingAmazonPriceHistoryJson = existingBook.amazonPriceHistory as any || '[]';
          amazonPriceHistory = JSON.parse(
            typeof existingAmazonPriceHistoryJson === 'string'
              ? existingAmazonPriceHistoryJson
              : JSON.stringify(existingAmazonPriceHistoryJson)
          );
          
          const newAmazonPriceEntry = {
            price: Number(amazonPrice),
            timestamp: new Date().toISOString()
          };
          
          amazonPriceHistory.push(newAmazonPriceEntry);
        }
        
        // If no historical high from API, check against local price history
        if (!historicalHighData) {
          // Find the historical high price from local history
          const allPrices = priceHistory.map((entry: any) => entry.price);
          const maxLocalPrice = Math.max(...allPrices, 0);
          
          // Use the higher of API result or local history
          if (maxLocalPrice > Number(historicalHigh)) {
            historicalHigh = maxLocalPrice;
            // Recalculate percentage with updated historical high
            percentOfHigh = (Number(currentPrice) / Number(historicalHigh)) * 100;
            
            // Determine price rank based on updated percentage
            if (percentOfHigh >= userSettings.greenThreshold.toNumber()) {
              priceRank = PriceRank.GREEN;
            } else if (percentOfHigh >= userSettings.yellowThreshold.toNumber()) {
              priceRank = PriceRank.YELLOW;
            } else {
              priceRank = PriceRank.RED;
            }
          }
        }
      } catch (error) {
        console.error('Error processing price history:', error);
        // If there's an error parsing, initialize with the current price
        priceHistory = [{
          vendorName: bestVendorName || 'Unknown',
          price: Number(currentPrice),
          timestamp: new Date().toISOString()
        }];
        
        if (amazonPrice) {
          amazonPriceHistory = [{
            price: Number(amazonPrice),
            timestamp: new Date().toISOString()
          }];
        }
      }
    } else {
      // Initialize price history with current price for new books
      priceHistory = [{
        vendorName: bestVendorName || 'Unknown',
        price: Number(currentPrice),
        timestamp: new Date().toISOString()
      }];
      
      if (amazonPrice) {
        amazonPriceHistory = [{
          price: Number(amazonPrice),
          timestamp: new Date().toISOString()
        }];
      }
    }
    
    // Format response data according to schema
    const bookData = {
      isbn: isbn10 || cleanIsbn,
      isbn13: isbn13 || cleanIsbn,
      title: title || 'Unknown Title',
      authors: authors || ['Unknown Author'],
      currentPrice: Number(currentPrice),
      amazonPrice: amazonPrice ? Number(amazonPrice) : null,
      bestVendorName,
      historicalHigh: Number(historicalHigh),
      percentOfHigh: Number(percentOfHigh),
      priceRank,
      publisher,
      publishedDate,
      description,
      imageUrl,
      priceHistory,
      amazonPriceHistory,
      lastPriceUpdate: new Date().toISOString(),
      existingBook: !!existingBook,
      historicalHighData
    };
    
    return NextResponse.json(bookData);
  } catch (error) {
    console.error('Error in price lookup:', error);
    return NextResponse.json({ 
      error: 'Failed to look up book price', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT endpoint 
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { isbn, batchId, purchasePrice, condition, notes, historicalHigh: manualHistoricalHigh } = body;
    
    if (!isbn || typeof isbn !== 'string' || isbn.trim() === '') {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 });
    }

    // Clean ISBN
    const cleanIsbn = isbn.trim().replace(/-/g, '');
    
    // Get user settings for threshold values
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    }) || {
      greenThreshold: new Decimal(50),
      yellowThreshold: new Decimal(1)
    };
    
    // First do a price lookup to get latest data
    const bookScouterData = await fetchBookPrice(cleanIsbn, userId);
    
    if (!bookScouterData) {
      return NextResponse.json({ error: 'Failed to fetch book data' }, { status: 500 });
    }
    
    // Get historical high price data if not provided manually
    let historicalHighData = null;
    if (!manualHistoricalHigh) {
      historicalHighData = await fetchHistoricalHighPrice(cleanIsbn, userId);
    }
    
    // Check if current price equals Amazon price and correct it if possible
    if (bookScouterData.priceEqualsAmazon) {
      // If current price equals Amazon price, get the most recent price from history
      const recentPrice = await fetchMostRecentHistoricalPrice(cleanIsbn, userId);
      
      if (recentPrice && recentPrice.price > 0) {
        // Set a more accurate current price instead of the Amazon price
        bookScouterData.currentPrice = recentPrice.price;
        
        // Update best vendor information if available
        if (recentPrice.vendor) {
          bookScouterData.bestVendorName = recentPrice.vendor;
        }
      }
    }
    
    // Parse and process book data
    const {
      currentPrice,
      amazonPrice,
      bestVendorName,
      title,
      authors,
      isbn10,
      isbn13,
      publisher,
      publishedDate,
      description,
      imageUrl
    } = bookScouterData;
    
    // Check if book already exists in user's inventory
    const existingBook = await prisma.book.findFirst({
      where: {
        OR: [
          { isbn: cleanIsbn },
          { isbn13: cleanIsbn }
        ],
        userId: session.user.id
      }
    });
    
    // Handle price history
    let priceHistory = [];
    let amazonPriceHistory = [];
    
    // Set historical high
    let historicalHigh: Decimal;
    if (manualHistoricalHigh) {
      // Use manually provided historical high if available
      historicalHigh = new Decimal(manualHistoricalHigh);
    } else if (historicalHighData && historicalHighData.maxPrice) {
      // Use API data if available
      historicalHigh = new Decimal(historicalHighData.maxPrice);
    } else {
      // Fallback to current price
      historicalHigh = new Decimal(currentPrice);
    }
    
    // Calculate percentage of historical high
    let percentOfHigh = new Decimal(100); // Default to 100%
    if (historicalHigh.greaterThan(0)) {
      percentOfHigh = new Decimal(currentPrice).dividedBy(historicalHigh).times(100);
    }
    
    // Determine price rank based on user settings
    let priceRank: PriceRank = PriceRank.GREEN;
    if (percentOfHigh.greaterThanOrEqualTo(userSettings.greenThreshold)) {
      priceRank = PriceRank.GREEN;
    } else if (percentOfHigh.greaterThanOrEqualTo(userSettings.yellowThreshold)) {
      priceRank = PriceRank.YELLOW;
    } else {
      priceRank = PriceRank.RED;
    }
    
    // Process existing price history or initialize new one
    if (existingBook) {
      try {
        // Process regular price history
        const existingPriceHistoryJson = existingBook.priceHistory as any || '[]';
        priceHistory = JSON.parse(
          typeof existingPriceHistoryJson === 'string' 
            ? existingPriceHistoryJson 
            : JSON.stringify(existingPriceHistoryJson)
        );
        
        // Add current price to history
        const newPriceEntry = {
          vendorName: bestVendorName || 'Unknown',
          price: Number(currentPrice),
          timestamp: new Date().toISOString()
        };
        
        priceHistory.push(newPriceEntry);
        
        // Process Amazon price history if available
        if (amazonPrice) {
          const existingAmazonPriceHistoryJson = existingBook.amazonPriceHistory as any || '[]';
          amazonPriceHistory = JSON.parse(
            typeof existingAmazonPriceHistoryJson === 'string'
              ? existingAmazonPriceHistoryJson
              : JSON.stringify(existingAmazonPriceHistoryJson)
          );
          
          const newAmazonPriceEntry = {
            price: Number(amazonPrice),
            timestamp: new Date().toISOString()
          };
          
          amazonPriceHistory.push(newAmazonPriceEntry);
        }
        
        // If no historical high from API or manual entry, check against local history
        if (!historicalHighData && !manualHistoricalHigh) {
          // Find the historical high price from local history
          const allPrices = priceHistory.map((entry: any) => entry.price);
          const maxLocalPrice = Math.max(...allPrices, 0);
          
          // Use local history high if it's higher
          if (maxLocalPrice > Number(historicalHigh)) {
            historicalHigh = new Decimal(maxLocalPrice);
            // Recalculate percentage
            percentOfHigh = new Decimal(currentPrice).dividedBy(historicalHigh).times(100);
            
            // Redetermine price rank
            if (percentOfHigh.greaterThanOrEqualTo(userSettings.greenThreshold)) {
              priceRank = PriceRank.GREEN;
            } else if (percentOfHigh.greaterThanOrEqualTo(userSettings.yellowThreshold)) {
              priceRank = PriceRank.YELLOW;
            } else {
              priceRank = PriceRank.RED;
            }
          }
        }
      } catch (error) {
        console.error('Error processing price history:', error);
        // Initialize with current price on error
        priceHistory = [{
          vendorName: bestVendorName || 'Unknown',
          price: Number(currentPrice),
          timestamp: new Date().toISOString()
        }];
        
        if (amazonPrice) {
          amazonPriceHistory = [{
            price: Number(amazonPrice),
            timestamp: new Date().toISOString()
          }];
        }
      }
    } else {
      // Initialize price history for new books
      priceHistory = [{
        vendorName: bestVendorName || 'Unknown',
        price: Number(currentPrice),
        timestamp: new Date().toISOString()
      }];
      
      if (amazonPrice) {
        amazonPriceHistory = [{
          price: Number(amazonPrice),
          timestamp: new Date().toISOString()
        }];
      }
    }

    let book;
    let addedToBatch = false;
    
    // Update or create the book
    if (existingBook) {
      // Update existing book
      book = await prisma.book.update({
        where: { id: existingBook.id },
        data: {
          title: title || existingBook.title,
          authors: authors || existingBook.authors,
          currentPrice: new Decimal(currentPrice),
          amazonPrice: amazonPrice ? new Decimal(amazonPrice) : null,
          historicalHigh,
          percentOfHigh,
          priceRank,
          bestVendorName,
          purchasePrice: purchasePrice !== undefined ? new Decimal(purchasePrice) : existingBook.purchasePrice,
          condition: condition !== undefined ? condition : existingBook.condition,
          notes: notes !== undefined ? notes : existingBook.notes,
          priceHistory: JSON.stringify(priceHistory),
          amazonPriceHistory: amazonPriceHistory.length > 0 
                    ? JSON.stringify(amazonPriceHistory) 
                    : existingBook.amazonPriceHistory 
                        ? existingBook.amazonPriceHistory 
                        : undefined,
          lastPriceUpdate: new Date(),
          batchId: batchId || existingBook.batchId
        },
      });
    } else {
      // Create new book
      book = await prisma.book.create({
        data: {
          isbn: isbn10 || cleanIsbn,
          isbn13: isbn13 || cleanIsbn,
          title: title || 'Unknown Title',
          authors: authors || ['Unknown Author'],
          currentPrice: new Decimal(currentPrice),
          amazonPrice: amazonPrice ? new Decimal(amazonPrice) : null,
          historicalHigh,
          percentOfHigh,
          priceRank,
          bestVendorName,
          purchasePrice: purchasePrice !== undefined ? new Decimal(purchasePrice) : null,
          condition: condition || null,
          notes: notes || null,
          priceHistory: JSON.stringify(priceHistory),
          amazonPriceHistory: amazonPriceHistory.length > 0 ? JSON.stringify(amazonPriceHistory) : undefined,
          lastPriceUpdate: new Date(),
          firstTracked: new Date(),
          userId: session.user.id,
          batchId: batchId || null
        },
      });
    }
    
    // If a batch ID was provided, update batch statistics
    if (batchId) {
      // Check if the batch exists and belongs to the user
      const batch = await prisma.batch.findUnique({
        where: {
          id: batchId,
          userId: session.user.id,
        },
      });
      
      if (batch) {
        // Only count as added to batch if the book wasn't already in this batch
        addedToBatch = !existingBook || existingBook.batchId !== batchId;
        
        if (addedToBatch) {
          // Get all books in the batch to recalculate statistics
          const batchBooks = await prisma.book.findMany({
            where: { batchId },
          });
          
          // Calculate batch statistics
          let greenCount = 0;
          let yellowCount = 0;
          let redCount = 0;
          let totalValue = 0;
          let highestPrice = 0;
          let highestPriceISBN = '';
          let sumPercent = 0;
          
          batchBooks.forEach(book => {
            if (book.priceRank === PriceRank.GREEN) greenCount++;
            else if (book.priceRank === PriceRank.YELLOW) yellowCount++;
            else redCount++;
            
            const bookPrice = Number(book.currentPrice);
            totalValue += bookPrice;
            
            if (bookPrice > highestPrice) {
              highestPrice = bookPrice;
              highestPriceISBN = book.isbn;
            }
            
            sumPercent += Number(book.percentOfHigh);
          });
          
          const totalBooks = batchBooks.length;
          const averagePercent = totalBooks > 0 ? sumPercent / totalBooks : 0;
          
          // Update batch statistics
          await prisma.batch.update({
            where: { id: batchId },
            data: {
              greenCount,
              yellowCount,
              redCount,
              totalBooks,
              totalValue: new Decimal(totalValue),
              averagePercent: new Decimal(averagePercent),
              highestPrice: new Decimal(highestPrice),
              highestPriceISBN,
              updatedAt: new Date(),
            },
          });
        }
      }
    }
    
    // Convert Decimal objects to numbers before sending response
    const serializedBook = {
      ...book,
      currentPrice: Number(book.currentPrice),
      amazonPrice: book.amazonPrice ? Number(book.amazonPrice) : null,
      historicalHigh: book.historicalHigh ? Number(book.historicalHigh) : null,
      percentOfHigh: book.percentOfHigh ? Number(book.percentOfHigh) : null,
      purchasePrice: book.purchasePrice ? Number(book.purchasePrice) : null,
    };
    
    return NextResponse.json({
      book: serializedBook,
      addedToBatch,
      message: addedToBatch
        ? `Book added to inventory and batch`
        : existingBook
          ? `Book updated in inventory` 
          : `Book added to inventory`
    });
  } catch (error) {
    console.error('Error adding book:', error);
    return NextResponse.json({ 
      error: 'Failed to add book', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// This endpoint remains for backward compatibility but forwards to the integrated solution
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isbn = searchParams.get('isbn');

  if (!isbn) {
    return NextResponse.json({ error: 'ISBN parameter is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const historicalData = await fetchHistoricalHighPrice(isbn, userId);
    return NextResponse.json(historicalData);
  } catch (error: any) {
    console.error("Error in highest price endpoint:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}