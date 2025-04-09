// src/app/api/batches/[id]/refresh-prices/route.ts
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

// In-memory storage for job status (in a production app, this would be stored in a database)
const jobStatusMap: Record<string, {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  batchId: string;
  booksTotal: number;
  booksProcessed: number;
  errorMessage?: string;
}> = {};

// Helper function to fetch book price for batch processing
async function fetchBookPriceForBatch(isbn: string, userId: string) {
  try {
    // Using our utility function to get book data
    const priceData = await fetchBookPrice(isbn, userId);
    
    // Check if current price equals Amazon price
    if (priceData.priceEqualsAmazon) {
      const recentPrice = await fetchMostRecentHistoricalPrice(isbn, userId);
      
      if (recentPrice && recentPrice.price > 0) {
        priceData.currentPrice = recentPrice.price;
        
        if (recentPrice.vendor) {
          priceData.bestVendorName = recentPrice.vendor;
        }
        
        console.log(`Updated current price from history for ISBN ${isbn}: ${recentPrice.price}`);
      }
    }
    
    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ISBN ${isbn}:`, error);
    return null;
  }
}

// Helper function to process batch price updates
async function processBatchPriceUpdates(batchId: string, jobId: string, userId: string) {
  try {
    // Mark job as running
    jobStatusMap[jobId] = {
      ...jobStatusMap[jobId],
      status: 'RUNNING',
    };

    // Get all books in the batch
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { books: true },
    });

    if (!batch) {
      jobStatusMap[jobId] = {
        ...jobStatusMap[jobId],
        status: 'FAILED',
        errorMessage: 'Batch not found',
      };
      return;
    }

    // Get user settings for threshold values
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: batch.userId },
    }) || {
      greenThreshold: new Decimal(50),
      yellowThreshold: new Decimal(1)
    };

    const books = batch.books;
    jobStatusMap[jobId].booksTotal = books.length;

    // Process each book sequentially to avoid rate limiting
    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;
    let totalValue = 0;
    let highestPrice = 0;
    let highestPriceISBN = '';
    let sumPercent = 0;

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      
      try {
        // Update job progress
        jobStatusMap[jobId].booksProcessed = i;

        // Skip books without ISBN
        if (!book.isbn) continue;

        // Fetch current price data
        const priceData = await fetchBookPriceForBatch(book.isbn, userId);
        
        if (!priceData) continue;

        // Get the current price and vendor
        let currentPrice = priceData.currentPrice;
        const amazonPrice = priceData.amazonPrice;
        let bestVendorName = priceData.bestVendorName;

        // Get historical high price data
        const historicalHighData = await fetchHistoricalHighPrice(book.isbn, userId);
        
        // Get the existing price history or initialize empty array
        const existingPriceHistoryJson = book.priceHistory as any || '[]';
        const priceHistory = JSON.parse(
          typeof existingPriceHistoryJson === 'string' 
            ? existingPriceHistoryJson 
            : JSON.stringify(existingPriceHistoryJson)
        );

        // Add current price to history
        const newPriceEntry = {
          vendorName: bestVendorName || 'Unknown',
          price: currentPrice,
          timestamp: new Date().toISOString()
        };
        
        priceHistory.push(newPriceEntry);

        // Use API historical high if available, otherwise find from local history
        let historicalHigh = 0;
        
        if (historicalHighData && historicalHighData.maxPrice) {
          historicalHigh = historicalHighData.maxPrice;
        } else {
          // Find from local price history
          const allPrices = priceHistory.map((entry: any) => entry.price);
          historicalHigh = Math.max(...allPrices, 0);
        }

        // Calculate percentage of historical high
        const percentOfHigh = historicalHigh > 0 
          ? (currentPrice / historicalHigh) * 100 
          : 100; // Default to 100% if no history

        // Determine price rank based on user settings
        let priceRank: PriceRank = PriceRank.RED;
        if (percentOfHigh >= userSettings.greenThreshold.toNumber()) {
          priceRank = PriceRank.GREEN;
          greenCount++;
        } else if (percentOfHigh >= userSettings.yellowThreshold.toNumber()) {
          priceRank = PriceRank.YELLOW;
          yellowCount++;
        } else {
          redCount++;
        }

        // Update the book record
        await prisma.book.update({
          where: { id: book.id },
          data: {
            currentPrice: new Decimal(currentPrice),
            amazonPrice: amazonPrice ? new Decimal(amazonPrice) : null,
            historicalHigh: new Decimal(historicalHigh),
            percentOfHigh: new Decimal(percentOfHigh),
            priceRank,
            bestVendorName,
            priceHistory: JSON.stringify(priceHistory),
            lastPriceUpdate: new Date(),
          },
        });

        // Update batch statistics
        totalValue += currentPrice;
        sumPercent += percentOfHigh;
        
        if (currentPrice > highestPrice) {
          highestPrice = currentPrice;
          highestPriceISBN = book.isbn;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (bookError) {
        console.error(`Error processing book ${book.id}:`, bookError);
        // Continue with next book even if one fails
      }
    }

    // Calculate averages
    const totalBooks = books.length;
    const averagePercent = totalBooks > 0 ? sumPercent / totalBooks : 0;

    // Update batch statistics and last update time
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
        lastPriceUpdate: new Date(),
      },
    });

    // Mark job as completed
    jobStatusMap[jobId] = {
      ...jobStatusMap[jobId],
      status: 'COMPLETED',
      booksProcessed: books.length,
    };
  } catch (error) {
    console.error(`Error processing batch ${batchId}:`, error);
    jobStatusMap[jobId] = {
      ...jobStatusMap[jobId],
      status: 'FAILED',
      errorMessage: 'An error occurred during price refresh',
    };
  }
}

// GET /api/batches/[id]/refresh-prices - Get job status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const batchId = params.id;
  const jobId = request.nextUrl.searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }
  
  // Check if job exists and belongs to the correct batch
  const job = jobStatusMap[jobId];
  
  if (!job || job.batchId !== batchId) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  return NextResponse.json(job);
}

// POST /api/batches/[id]/refresh-prices - Start a price refresh job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const batchId = params.id;
  
  try {
    // Check if batch exists and belongs to user
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        userId: session.user.id,
      },
    });
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    // Create a job ID
    const jobId = `refresh-${batchId}-${Date.now()}`;
    
    // Initialize job status
    jobStatusMap[jobId] = {
      status: 'PENDING',
      batchId,
      booksTotal: 0,
      booksProcessed: 0,
    };
    
    // Start processing in the background
    processBatchPriceUpdates(batchId, jobId, userId).catch(error => {
      console.error(`Background job error for batch ${batchId}:`, error);
    });
    
    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Error starting price refresh:', error);
    return NextResponse.json({ error: 'Failed to start price refresh' }, { status: 500 });
  }
}