// src/lib/book-scouter.ts

import { prisma } from '@/lib/db';

interface BookScouterCredentials {
  username: string;
  password: string;
}

interface BookScouterToken {
  token: string;
  expiresAt: Date;
}

// Default credentials - in production, these should be in environment variables
const DEFAULT_CREDENTIALS: BookScouterCredentials = {
  username: "ash@lsbookstore.com",
  password: "Chhatrala1!"
};

// BookScouter API endpoints
const API_BASE_URL = 'https://api.bookscouter.com/v4';
const AUTH_URL = `${API_BASE_URL}/auth`;
const SELL_PRICES_URL = `${API_BASE_URL}/prices/sell`;
const HISTORIC_WEEKLY_URL = `${API_BASE_URL}/historic/sell/weekly`;

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests to reduce rate limiting

/**
 * Add rate limiting to prevent overwhelming the API
 */
async function rateLimitedRequest(requestFn: () => Promise<any>): Promise<any> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏱️  Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  return requestFn();
}

// Standard headers for API requests
const getStandardHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'accept': 'application/ld+json',
    'accept-language': 'en-US,en;q=0.8',
    'origin': 'https://bookscouter.com',
    'referer': 'https://bookscouter.com/',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
  };

  if (token) {
    headers['Cookie'] = `AuthToken=${token}`;
  }

  return headers;
};

/**
 * Authenticate with BookScouter and get a new token
 */
async function authenticateWithBookScouter(credentials: BookScouterCredentials = DEFAULT_CREDENTIALS): Promise<BookScouterToken> {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/ld+json',
        'accept-language': 'en-US,en;q=0.8',
        'content-type': 'application/json',
        'origin': 'https://bookscouter.com',
        'referer': 'https://bookscouter.com/',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        auth: false,
        username: credentials.username,
        password: credentials.password,
        remember: true
      })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const token = data.token;

    // Parse token to get expiration time
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    const expiresAt = new Date(payload.exp * 1000); // Convert Unix timestamp to Date

    return { token, expiresAt };
  } catch (error) {
    console.error('BookScouter authentication error:', error);
    throw error;
  }
}

/**
 * Get a valid BookScouter token, refreshing if necessary
 */
async function getValidToken(userId?: string): Promise<string> {
  try {
    // If we have a userId, try to get the token from the database
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bookScouterToken: true, bookScouterTokenExpiry: true }
      });

      // If the user has a token and it's not expired, return it
      if (user?.bookScouterToken && user?.bookScouterTokenExpiry) {
        const tokenExpiry = new Date(user.bookScouterTokenExpiry);
        if (tokenExpiry > new Date()) {
          return user.bookScouterToken;
        }
      }
    }

    // Otherwise, get a new token
    const { token, expiresAt } = await authenticateWithBookScouter();

    // If we have a userId, save the token to the database
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          bookScouterToken: token,
          bookScouterTokenExpiry: expiresAt
        }
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting valid token:', error);
    throw error;
  }
}

/**
 * Make an authenticated request to BookScouter API
 */
async function makeBookScouterRequest(
  url: string,
  options: RequestInit = {},
  userId?: string,
  retryOnAuth = true
): Promise<any> {
  return rateLimitedRequest(async () => {
    try {
    const token = await getValidToken(userId);
    const headers = {
      ...getStandardHeaders(token),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If unauthorized and we should retry, get a new token and retry
    if ((response.status === 401 || response.status === 403) && retryOnAuth) {
      // Force a new token
      const newToken = await authenticateWithBookScouter();
      
      // Update token in database if userId is provided
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            bookScouterToken: newToken.token,
            bookScouterTokenExpiry: newToken.expiresAt
          }
        });
      }

      // Retry the request with the new token (with rate limiting)
      return makeBookScouterRequest(url, options, userId, false);
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000; // Use Retry-After header or default 10 seconds
      console.log(`⏱️  Rate limited by API, waiting ${waitTime/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Don't retry auth, but do retry the request once
      return makeBookScouterRequest(url, options, userId, false);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ BookScouter API error:', response.status, response.statusText, errorText);
      
      // Handle specific error cases
      if (response.status === 404) {
        throw new Error(`Book not found: ${url}`);
      } else if (response.status >= 500) {
        throw new Error(`BookScouter server error: ${response.status} - Please try again later`);
      } else {
        throw new Error(`BookScouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    return response.json();
  } catch (error) {
    console.error(`❌ Error making BookScouter request to ${url}:`, error);
    throw error;
    }
  });
}

/**
 * Get book price data from BookScouter
 */
export async function fetchBookPrice(isbn: string, userId?: string): Promise<any> {
  try {
    const url = `${SELL_PRICES_URL}/${isbn}`;
    console.log(`📡 Fetching price for ISBN: ${isbn}`);
    const data = await makeBookScouterRequest(url, {}, userId);

    // Extract relevant data
    const book = data.book || {};
    
    // Filter out vendors with zero or negative prices
    const validVendors = (data.prices || [])
      .filter((offer: any) => offer.price > 0)
      .sort((a: any, b: any) => b.price - a.price); // Sort by price (highest first)
    
    console.log(`📊 ISBN ${isbn}: Found ${validVendors.length} valid offers out of ${data.prices?.length || 0} total`);
    
    // Log all prices for debugging
    if (data.prices && data.prices.length > 0) {
      const pricesSummary = data.prices.map((offer: any) => ({
        vendor: offer.vendor.name,
        price: offer.price
      }));
      console.log(`💰 Price summary for ${isbn}:`, pricesSummary);
    }
    
    const bestVendor = validVendors.length > 0 ? validVendors[0] : null;
    const currentPrice = bestVendor ? bestVendor.price : 0;
    const amazonPrice = book.amazonLowestPrice || null;
    const bestVendorName = bestVendor ? bestVendor.vendor.name : null;
    
    console.log(`✅ ISBN ${isbn}: Current price $${currentPrice}, Amazon $${amazonPrice}, Best vendor: ${bestVendorName || 'None'}`);
    
    // Check if current price equals Amazon price
    const priceEqualsAmazon = amazonPrice !== null && currentPrice === amazonPrice;
    
    return {
      currentPrice,
      amazonPrice,
      bestVendorName,
      title: book.title,
      authors: book.author || [],
      isbn10: book.isbn10,
      isbn13: book.isbn13,
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
      imageUrl: book.image,
      priceEqualsAmazon
    };
  } catch (error) {
    console.error(`Error fetching price for ISBN ${isbn}:`, error);
    throw error;
  }
}

/**
 * Get historical price data for a book
 */
export async function fetchHistoricalPriceData(isbn: string, userId?: string): Promise<any> {
  try {
    const url = `${HISTORIC_WEEKLY_URL}?isbn=${isbn}`;
    const data = await makeBookScouterRequest(url, {}, userId);
    
    // Check if we have valid data
    if (!data["hydra:member"] || !Array.isArray(data["hydra:member"]) || data["hydra:member"].length === 0) {
      return [];
    }
    
    // Format the data
    return data["hydra:member"].map((item: any) => ({
      week: item.dateSeen,
      maxPrice: item.maxPrice || 0,
      avgPrice: item.avgPrice || 0,
      bestVendor: item.bestVendor && item.bestVendor.name ? item.bestVendor.name : 'Unknown'
    }));
  } catch (error) {
    console.error(`Error fetching historical price data for ISBN ${isbn}:`, error);
    throw error;
  }
}

/**
 * Get historical highest price for a book
 */
export async function fetchHistoricalHighPrice(isbn: string, userId?: string): Promise<any> {
  try {
    const priceHistory = await fetchHistoricalPriceData(isbn, userId);
    
    if (priceHistory.length === 0) {
      return null;
    }
    
    // Find the highest price and its details
    let highestPriceData = priceHistory.reduce((highest: any, current: any) => {
      return current.maxPrice > highest.maxPrice ? current : highest;
    }, { maxPrice: 0 });
    
    return {
      maxPrice: highestPriceData.maxPrice,
      week: highestPriceData.week,
      bestVendor: highestPriceData.bestVendor
    };
  } catch (error) {
    console.error(`Error fetching highest price for ISBN ${isbn}:`, error);
    throw error;
  }
}

/**
 * Get most recent price from weekly history
 */
export async function fetchMostRecentHistoricalPrice(isbn: string, userId?: string): Promise<any> {
  try {
    const priceHistory = await fetchHistoricalPriceData(isbn, userId);
    
    if (priceHistory.length === 0) {
      return null;
    }
    
    // Sort by most recent week
    const sortedHistory = [...priceHistory].sort((a, b) => {
      return b.week.localeCompare(a.week);
    });
    
    // Get the most recent week's data
    const latestWeekData = sortedHistory[0];
    
    if (latestWeekData && latestWeekData.maxPrice > 0) {
      return {
        price: latestWeekData.maxPrice,
        vendor: latestWeekData.bestVendor
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching recent price history for ISBN ${isbn}:`, error);
    throw error;
  }
}

export default {
  fetchBookPrice,
  fetchHistoricalPriceData,
  fetchHistoricalHighPrice,
  fetchMostRecentHistoricalPrice,
  authenticateWithBookScouter,
  getValidToken
};