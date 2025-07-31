'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from 'react-hot-toast';
import { 
  Edit, 
  TrendingUp, 
  Bell, 
  FolderPlus, 
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  Star,
  ShoppingCart,
  BarChart3
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  authors: string[];
  isbn: string;
  isbn13: string | null;
  notes: string | null;
  currentPrice: number;
  purchasePrice: number | null;
  condition: string;
  lastPriceUpdate: string;
  historicalHigh: number;
  percentOfHigh: number;
  priceRank: string;
  amazonPrice: number | null;
  bestVendorName: string | null;
  priceHistory: any;
  amazonPriceHistory: any;
  bestQuotePrice: number | null;
  bestQuoteVendor: string | null;
  totalQuotes: number;
  lastQuoteUpdate: string | null;
  sellRecommendation: string | null;
  createdAt: string;
  updatedAt: string;
  batch?: {
    id: string;
    name: string;
  } | null;
  bookMetadata?: {
    id: string;
    title: string;
    authors: string[];
    publisher: string | null;
    publishedDate: string | null;
    description: string | null;
    imageUrl: string | null;
    categories: string[];
    pageCount: number | null;
    language: string | null;
    averageRating: number | null;
    ratingsCount: number | null;
  } | null;
}

interface BookScouterData {
  currentPrice: number;
  historicalHigh: number;
  percentOfHigh: number;
  priceRank: string;
  bestVendorName: string;
  amazonPrice: number;
  allVendors: Array<{
    vendor: string;
    price: number;
  }>;
}

interface GoogleBooksData {
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  imageUrl: string;
  categories: string[];
  pageCount: number;
  language: string;
  averageRating: number;
  ratingsCount: number;
  industryIdentifiers: Array<{
    type: string;
    identifier: string;
  }>;
}

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<Book | null>(null);
  const [bookScouterData, setBookScouterData] = useState<BookScouterData | null>(null);
  const [googleBooksData, setGoogleBooksData] = useState<GoogleBooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch book from database
      const bookResponse = await fetch(`/api/books/${bookId}`);
      if (bookResponse.ok) {
        const bookData = await bookResponse.json();
        setBook(bookData);
        
        // Fetch latest BookScouter data
        if (bookData.isbn) {
          await fetchBookScouterData(bookData.isbn);
        }
        
        // Fetch Google Books data
        if (bookData.isbn) {
          await fetchGoogleBooksData(bookData.isbn);
        }
      } else {
        toast.error('Failed to fetch book details');
      }
    } catch (error) {
      toast.error('Error loading book details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookScouterData = async (isbn: string) => {
    try {
      const response = await fetch('/api/books/price-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookScouterData(data);
      }
    } catch (error) {
      console.log('Could not fetch BookScouter data');
    }
  };

  const fetchGoogleBooksData = async (isbn: string) => {
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo;
        setGoogleBooksData({
          title: bookInfo.title || '',
          authors: bookInfo.authors || [],
          publisher: bookInfo.publisher || '',
          publishedDate: bookInfo.publishedDate || '',
          description: bookInfo.description || '',
          imageUrl: bookInfo.imageLinks?.thumbnail || '',
          categories: bookInfo.categories || [],
          pageCount: bookInfo.pageCount || null,
          language: bookInfo.language || '',
          averageRating: bookInfo.averageRating || null,
          ratingsCount: bookInfo.ratingsCount || null,
          industryIdentifiers: bookInfo.industryIdentifiers || []
        });
      }
    } catch (error) {
      console.log('Could not fetch Google Books data');
    }
  };

  const refreshPrices = async () => {
    if (!book?.isbn) return;
    
    try {
      setRefreshingPrices(true);
      await fetchBookScouterData(book.isbn);
      toast.success('Prices refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh prices');
    } finally {
      setRefreshingPrices(false);
    }
  };

  // Button action handlers
  const handleEditBook = () => {
    router.push(`/dashboard/books/manage?edit=${bookId}`);
  };

  const handleViewPriceHistory = () => {
    if (book?.isbn) {
      router.push(`/dashboard/pro-tools/price-history?isbn=${book.isbn}`);
    } else {
      toast.error('No ISBN available for price history');
    }
  };

  const handleSetPriceAlert = () => {
    setShowPriceAlertModal(true);
  };

  const handleAddToBatch = () => {
    setShowBatchModal(true);
  };

  const handleBackToBooks = () => {
    router.push('/dashboard/books');
  };

  const getPriceRankColor = (rank: string) => {
    switch (rank) {
      case 'GREEN': return 'bg-green-100 text-green-800';
      case 'YELLOW': return 'bg-yellow-100 text-yellow-800';
      case 'RED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'LIKE_NEW': return 'bg-green-100 text-green-800';
      case 'VERY_GOOD': return 'bg-yellow-100 text-yellow-800';
      case 'GOOD': return 'bg-orange-100 text-orange-800';
      case 'ACCEPTABLE': return 'bg-red-100 text-red-800';
      case 'POOR': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
          <p className="text-gray-600 mb-4">The book you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToBooks}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">{book.title}</h1>
                  <p className="text-blue-100 mt-1 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    by {book.authors.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={refreshPrices}
                  disabled={refreshingPrices}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshingPrices ? 'animate-spin' : ''}`} />
                  {refreshingPrices ? 'Refreshing...' : 'Refresh Prices'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Quick stats bar */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Current Price</p>
                <p className="text-xl font-bold text-green-600">${book.currentPrice}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Historical High</p>
                <p className="text-xl font-bold text-blue-600">${book.historicalHigh}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Price Rank</p>
                <Badge color={book.priceRank === 'GREEN' ? 'success' : book.priceRank === 'YELLOW' ? 'warning' : 'error'}>
                  {book.priceRank}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Best Vendor</p>
                <p className="text-sm font-semibold text-gray-900">{book.bestVendorName || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Book Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Book Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Book Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-500">ISBN</p>
                    <Badge color="light" size="sm">{book.isbn}</Badge>
                  </div>
                </div>
                {book.isbn13 && (
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-500">ISBN-13</p>
                      <Badge color="light" size="sm">{book.isbn13}</Badge>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Condition</p>
                  <Badge color={book.condition === 'NEW' ? 'success' : book.condition === 'LIKE_NEW' ? 'success' : book.condition === 'VERY_GOOD' ? 'warning' : book.condition === 'GOOD' ? 'warning' : 'error'}>
                    {book.condition.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Batch</p>
                  <div className="flex items-center space-x-2">
                    <FolderPlus className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {book.batch?.name || 'No batch assigned'}
                    </span>
                  </div>
                </div>
                {book.purchasePrice && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Purchase Price</p>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">${book.purchasePrice}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Added to Inventory</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {book.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-sm text-gray-900 mt-1">{book.notes}</p>
                </div>
              )}
            </div>

            {/* Pricing Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Pricing Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <p className="text-sm font-medium text-gray-500">Current Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${book.currentPrice}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-gray-500">Historical High</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${book.historicalHigh}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <p className="text-sm font-medium text-gray-500">% of High</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {book.percentOfHigh}%
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <p className="text-sm font-medium text-gray-500">Price Rank</p>
                  <Badge color={book.priceRank === 'GREEN' ? 'success' : book.priceRank === 'YELLOW' ? 'warning' : 'error'}>
                    {book.priceRank}
                  </Badge>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                  <p className="text-sm font-medium text-gray-500">Amazon Price</p>
                  <p className="text-lg font-semibold text-purple-600">
                    ${book.amazonPrice || 'N/A'}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-500">Best Vendor</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {book.bestVendorName || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {/* Last Updated */}
              <div className="mt-6 text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  Last price update: {new Date(book.lastPriceUpdate).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Google Books Information */}
            {googleBooksData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Book Details (Google Books)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {googleBooksData.imageUrl && (
                    <div className="flex justify-center">
                      <img
                        src={googleBooksData.imageUrl}
                        alt={googleBooksData.title}
                        className="h-64 object-contain rounded-lg shadow"
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    {googleBooksData.publisher && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Publisher</p>
                        <p className="text-sm text-gray-900">{googleBooksData.publisher}</p>
                      </div>
                    )}
                    {googleBooksData.publishedDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Published Date</p>
                        <p className="text-sm text-gray-900">{googleBooksData.publishedDate}</p>
                      </div>
                    )}
                    {googleBooksData.pageCount && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pages</p>
                        <p className="text-sm text-gray-900">{googleBooksData.pageCount}</p>
                      </div>
                    )}
                    {googleBooksData.language && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Language</p>
                        <p className="text-sm text-gray-900">{googleBooksData.language.toUpperCase()}</p>
                      </div>
                    )}
                    {googleBooksData.averageRating && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Rating</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{googleBooksData.averageRating}/5</span>
                          <span className="text-sm text-gray-500">({googleBooksData.ratingsCount} ratings)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {googleBooksData.description && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm text-gray-900 mt-1 leading-relaxed">
                      {googleBooksData.description}
                    </p>
                  </div>
                )}
                {googleBooksData.categories && googleBooksData.categories.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">Categories</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {googleBooksData.categories.map((category, index) => (
                        <Badge key={index} color="info">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BookScouter Vendor Information */}
            {bookScouterData && bookScouterData.allVendors && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">All Vendor Prices (BookScouter)</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookScouterData.allVendors
                        .filter(vendor => vendor.price > 0)
                        .sort((a, b) => b.price - a.price)
                        .map((vendor, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {vendor.vendor}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${vendor.price}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={handleEditBook}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Book
                </Button>
                <Button 
                  onClick={handleViewPriceHistory}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Price History
                </Button>
                <Button 
                  onClick={handleSetPriceAlert}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Set Price Alert
                </Button>
                <Button 
                  onClick={handleAddToBatch}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add to Batch
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <ShoppingCart className="h-6 w-6 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Quote Statistics</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-gray-500">Total Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{book.totalQuotes}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-gray-500">Best Quote Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${book.bestQuotePrice || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-gray-500">Best Quote Vendor</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {book.bestQuoteVendor || 'Unknown'}
                  </p>
                </div>
                {book.sellRecommendation && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-gray-500">Sell Recommendation</p>
                    <Badge color="warning">
                      {book.sellRecommendation}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Price History Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Price History</h2>
              </div>
              <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Price history chart coming soon...</p>
                  <p className="text-sm text-gray-400 mt-1">Interactive charts and analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 