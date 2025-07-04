import { PriceRank } from '@prisma/client';

export interface PriceAlert {
  id: string;
  type: 'PRICE_DROP' | 'PRICE_SPIKE' | 'TREND_CHANGE' | 'OPPORTUNITY' | 'WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  currentPrice: number;
  previousPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  aiInsight: string;
  actionRecommendation: string;
  confidence: number; // 0-100
  createdAt: Date;
  expiresAt?: Date;
}

export interface BookPriceData {
  id: string;
  title: string;
  isbn: string;
  currentPrice: number;
  purchasePrice: number;
  priceRank: PriceRank;
  percentOfHigh: number;
  lastPriceUpdate: Date;
  priceHistory?: Array<{
    price: number;
    date: Date;
  }>;
}

export class AIInsightsService {
  
  /**
   * Analyze book pricing data and generate AI-powered insights
   */
  static generatePriceAlerts(books: BookPriceData[]): PriceAlert[] {
    const alerts: PriceAlert[] = [];

    for (const book of books) {
      // Analyze current price vs purchase price
      const profitMargin = ((book.currentPrice - book.purchasePrice) / book.purchasePrice) * 100;
      
      // Generate alerts based on different scenarios
      alerts.push(...this.analyzeProfitability(book, profitMargin));
      alerts.push(...this.analyzePriceRank(book));
      alerts.push(...this.analyzeMarketPosition(book));
      
      if (book.priceHistory && book.priceHistory.length > 1) {
        alerts.push(...this.analyzePriceTrends(book));
      }
    }

    return alerts.sort((a, b) => {
      // Sort by severity and confidence
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.confidence - a.confidence;
    });
  }

  private static analyzeProfitability(book: BookPriceData, profitMargin: number): PriceAlert[] {
    const alerts: PriceAlert[] = [];

    if (profitMargin > 100) {
      alerts.push({
        id: `profit-${book.id}-${Date.now()}`,
        type: 'OPPORTUNITY',
        severity: 'HIGH',
        title: '🚀 Exceptional Profit Opportunity',
        message: `${book.title} has doubled in value!`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        previousPrice: book.purchasePrice,
        priceChange: book.currentPrice - book.purchasePrice,
        priceChangePercent: profitMargin,
        aiInsight: `This book has experienced exceptional appreciation of ${profitMargin.toFixed(1)}%. This could indicate high demand, scarcity, or emerging collectible status. The current market conditions suggest strong buyer interest.`,
        actionRecommendation: `Consider selling now to maximize profit, or hold if you believe the trend will continue. Monitor similar titles for market validation.`,
        confidence: 95,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    } else if (profitMargin > 50) {
      alerts.push({
        id: `profit-${book.id}-${Date.now()}`,
        type: 'OPPORTUNITY',
        severity: 'MEDIUM',
        title: '📈 Strong Profit Potential',
        message: `${book.title} shows ${profitMargin.toFixed(1)}% profit margin`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        previousPrice: book.purchasePrice,
        priceChange: book.currentPrice - book.purchasePrice,
        priceChangePercent: profitMargin,
        aiInsight: `Strong performance with ${profitMargin.toFixed(1)}% appreciation. This suggests good market demand and proper pricing. The book is performing well above average market returns.`,
        actionRecommendation: `Good time to consider selling, or continue holding if market trends remain positive. Set a price alert for further increases.`,
        confidence: 85,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      });
    } else if (profitMargin < -20) {
      alerts.push({
        id: `loss-${book.id}-${Date.now()}`,
        type: 'WARNING',
        severity: 'HIGH',
        title: '⚠️ Significant Value Loss',
        message: `${book.title} has declined ${Math.abs(profitMargin).toFixed(1)}%`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        previousPrice: book.purchasePrice,
        priceChange: book.currentPrice - book.purchasePrice,
        priceChangePercent: profitMargin,
        aiInsight: `Significant decline of ${Math.abs(profitMargin).toFixed(1)}% suggests market oversupply, reduced demand, or newer editions available. This trend may continue if market conditions don't improve.`,
        actionRecommendation: `Consider cutting losses if trend continues, or hold if you believe in long-term recovery. Research market factors causing the decline.`,
        confidence: 80,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    }

    return alerts;
  }

  private static analyzePriceRank(book: BookPriceData): PriceAlert[] {
    const alerts: PriceAlert[] = [];

    if (book.priceRank === 'GREEN' && book.percentOfHigh > 90) {
      alerts.push({
        id: `rank-${book.id}-${Date.now()}`,
        type: 'OPPORTUNITY',
        severity: 'HIGH',
        title: '🟢 Peak Market Performance',
        message: `${book.title} is at ${book.percentOfHigh}% of historical high`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        aiInsight: `Excellent market position at ${book.percentOfHigh}% of historical high. This indicates strong demand and optimal pricing. The book is performing in the top tier of its market segment.`,
        actionRecommendation: `Prime selling opportunity. Consider listing at current market rates or slightly higher. Monitor for any signs of market saturation.`,
        confidence: 92,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
      });
    } else if (book.priceRank === 'RED' && book.percentOfHigh < 30) {
      alerts.push({
        id: `rank-${book.id}-${Date.now()}`,
        type: 'WARNING',
        severity: 'MEDIUM',
        title: '🔴 Below Market Performance',
        message: `${book.title} is only at ${book.percentOfHigh}% of historical high`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        aiInsight: `Significantly below historical performance at ${book.percentOfHigh}% of peak value. This could indicate market correction, oversupply, or changing demand patterns.`,
        actionRecommendation: `Hold for potential recovery or consider strategic exit. Research market conditions and comparable titles for context.`,
        confidence: 75,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days
      });
    }

    return alerts;
  }

  private static analyzeMarketPosition(book: BookPriceData): PriceAlert[] {
    const alerts: PriceAlert[] = [];

    // Analyze based on time since last update
    const daysSinceUpdate = Math.floor((Date.now() - book.lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceUpdate > 30) {
      alerts.push({
        id: `stale-${book.id}-${Date.now()}`,
        type: 'WARNING',
        severity: 'LOW',
        title: '📅 Price Data Outdated',
        message: `${book.title} hasn't been updated in ${daysSinceUpdate} days`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        aiInsight: `Price data is ${daysSinceUpdate} days old, which may not reflect current market conditions. Market dynamics could have changed significantly during this period.`,
        actionRecommendation: `Update price data to get accurate market insights. Consider checking multiple marketplaces for current pricing trends.`,
        confidence: 90,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }

    return alerts;
  }

  private static analyzePriceTrends(book: BookPriceData): PriceAlert[] {
    const alerts: PriceAlert[] = [];
    
    if (!book.priceHistory || book.priceHistory.length < 2) return alerts;

    const recentPrices = book.priceHistory.slice(-5); // Last 5 price points
    const trend = this.calculateTrend(recentPrices.map(p => p.price));

    if (trend.direction === 'RISING' && trend.strength > 0.7) {
      alerts.push({
        id: `trend-${book.id}-${Date.now()}`,
        type: 'OPPORTUNITY',
        severity: 'MEDIUM',
        title: '📊 Strong Upward Trend',
        message: `${book.title} shows consistent price increases`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        aiInsight: `Strong upward trend detected with ${(trend.strength * 100).toFixed(0)}% confidence. Recent price movements suggest sustained demand growth and positive market sentiment.`,
        actionRecommendation: `Monitor closely for optimal selling point. Consider setting a target price based on trend projection. Market momentum appears favorable.`,
        confidence: Math.round(trend.strength * 100),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days
      });
    } else if (trend.direction === 'FALLING' && trend.strength > 0.6) {
      alerts.push({
        id: `trend-${book.id}-${Date.now()}`,
        type: 'WARNING',
        severity: 'MEDIUM',
        title: '📉 Declining Price Trend',
        message: `${book.title} shows consistent price decreases`,
        bookId: book.id,
        bookTitle: book.title,
        isbn: book.isbn,
        currentPrice: book.currentPrice,
        aiInsight: `Downward trend detected with ${(trend.strength * 100).toFixed(0)}% confidence. Market conditions suggest weakening demand or increased supply affecting pricing.`,
        actionRecommendation: `Consider selling before further decline or wait for trend reversal. Analyze market factors driving the downward movement.`,
        confidence: Math.round(trend.strength * 100),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      });
    }

    return alerts;
  }

  private static calculateTrend(prices: number[]): { direction: 'RISING' | 'FALLING' | 'STABLE', strength: number } {
    if (prices.length < 2) return { direction: 'STABLE', strength: 0 };

    let risingCount = 0;
    let fallingCount = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) risingCount++;
      else if (prices[i] < prices[i - 1]) fallingCount++;
    }

    const totalChanges = risingCount + fallingCount;
    if (totalChanges === 0) return { direction: 'STABLE', strength: 0 };

    if (risingCount > fallingCount) {
      return { direction: 'RISING', strength: risingCount / totalChanges };
    } else if (fallingCount > risingCount) {
      return { direction: 'FALLING', strength: fallingCount / totalChanges };
    } else {
      return { direction: 'STABLE', strength: 0.5 };
    }
  }

  /**
   * Generate market insights summary
   */
  static generateMarketSummary(books: BookPriceData[]): {
    totalBooks: number;
    totalValue: number;
    totalProfit: number;
    profitMargin: number;
    topPerformers: BookPriceData[];
    underPerformers: BookPriceData[];
    marketTrend: string;
    aiSummary: string;
  } {
    const totalBooks = books.length;
    const totalValue = books.reduce((sum, book) => sum + book.currentPrice, 0);
    const totalCost = books.reduce((sum, book) => sum + book.purchasePrice, 0);
    const totalProfit = totalValue - totalCost;
    const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const topPerformers = books
      .filter(book => ((book.currentPrice - book.purchasePrice) / book.purchasePrice) * 100 > 20)
      .sort((a, b) => {
        const aProfit = ((a.currentPrice - a.purchasePrice) / a.purchasePrice) * 100;
        const bProfit = ((b.currentPrice - b.purchasePrice) / b.purchasePrice) * 100;
        return bProfit - aProfit;
      })
      .slice(0, 5);

    const underPerformers = books
      .filter(book => ((book.currentPrice - book.purchasePrice) / book.purchasePrice) * 100 < -10)
      .sort((a, b) => {
        const aProfit = ((a.currentPrice - a.purchasePrice) / a.purchasePrice) * 100;
        const bProfit = ((b.currentPrice - b.purchasePrice) / b.purchasePrice) * 100;
        return aProfit - bProfit;
      })
      .slice(0, 5);

    const greenBooks = books.filter(book => book.priceRank === 'GREEN').length;
    const yellowBooks = books.filter(book => book.priceRank === 'YELLOW').length;
    const redBooks = books.filter(book => book.priceRank === 'RED').length;

    let marketTrend = 'STABLE';
    if (greenBooks > yellowBooks + redBooks) marketTrend = 'BULLISH';
    else if (redBooks > greenBooks + yellowBooks) marketTrend = 'BEARISH';

    const aiSummary = this.generateAISummary({
      totalBooks,
      totalValue,
      totalProfit,
      profitMargin,
      topPerformers: topPerformers.length,
      underPerformers: underPerformers.length,
      marketTrend,
      greenBooks,
      yellowBooks,
      redBooks
    });

    return {
      totalBooks,
      totalValue,
      totalProfit,
      profitMargin,
      topPerformers,
      underPerformers,
      marketTrend,
      aiSummary
    };
  }

  private static generateAISummary(data: any): string {
    const { totalBooks, totalProfit, profitMargin, topPerformers, underPerformers, marketTrend, greenBooks, yellowBooks, redBooks } = data;

    let summary = `Portfolio Analysis: Your ${totalBooks} book collection `;

    if (profitMargin > 20) {
      summary += `is performing exceptionally well with a ${profitMargin.toFixed(1)}% profit margin. `;
    } else if (profitMargin > 0) {
      summary += `is showing positive returns with a ${profitMargin.toFixed(1)}% profit margin. `;
    } else {
      summary += `is currently at a ${Math.abs(profitMargin).toFixed(1)}% loss, requiring attention. `;
    }

    summary += `Market distribution shows ${greenBooks} high-performing (green), ${yellowBooks} moderate (yellow), and ${redBooks} underperforming (red) books. `;

    if (marketTrend === 'BULLISH') {
      summary += `The overall market trend is bullish, suggesting good selling opportunities. `;
    } else if (marketTrend === 'BEARISH') {
      summary += `The market trend is bearish, consider holding or strategic exits. `;
    } else {
      summary += `The market is stable with mixed performance across your portfolio. `;
    }

    if (topPerformers > 0) {
      summary += `You have ${topPerformers} strong performers that could be prime for selling. `;
    }

    if (underPerformers > 0) {
      summary += `${underPerformers} books need attention due to declining values. `;
    }

    summary += `Consider rebalancing your portfolio based on current market conditions and performance metrics.`;

    return summary;
  }
}

// Enhanced AI Insights with Market Intelligence
export interface MarketIntelligence {
  priceVolatility: number;
  demandTrend: 'HIGH' | 'MEDIUM' | 'LOW';
  supplyTrend: 'HIGH' | 'MEDIUM' | 'LOW';
  seasonalPattern: string;
  competitorAnalysis: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    marketPosition: 'ABOVE' | 'BELOW' | 'COMPETITIVE';
  };
  predictedPrice: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
}

export interface SmartRecommendation {
  id: string;
  type: 'SELL_NOW' | 'HOLD_LONGER' | 'BUY_MORE' | 'PRICE_ADJUSTMENT' | 'MARKET_TIMING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  reasoning: string;
  actionItems: string[];
  confidence: number;
  potentialValue: number;
  timeframe: string;
  bookId?: string;
  isbn?: string;
}

export interface AdvancedAnalytics {
  portfolioHealth: {
    score: number;
    factors: {
      diversification: number;
      priceStability: number;
      liquidityRisk: number;
      marketTiming: number;
    };
  };
  profitabilityMetrics: {
    roi: number;
    averageHoldingTime: number;
    turnoverRate: number;
    profitMargin: number;
  };
  marketPosition: {
    competitiveAdvantage: string[];
    marketShare: number;
    priceLeadership: boolean;
  };
  riskAssessment: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    mitigation: string[];
  };
}

/**
 * Generate advanced AI insights for a user's inventory
 */
export async function generateAdvancedInsights(userId: string): Promise<{
  insights: AIInsight[];
  recommendations: SmartRecommendation[];
  marketIntelligence: MarketIntelligence[];
  analytics: AdvancedAnalytics;
}> {
  try {
    // Get user's books with enhanced data
    const books = await prisma.book.findMany({
      where: { userId },
      include: {
        bookMetadata: true,
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (books.length === 0) {
      return {
        insights: [],
        recommendations: [],
        marketIntelligence: [],
        analytics: {
          portfolioHealth: { score: 0, factors: { diversification: 0, priceStability: 0, liquidityRisk: 0, marketTiming: 0 } },
          profitabilityMetrics: { roi: 0, averageHoldingTime: 0, turnoverRate: 0, profitMargin: 0 },
          marketPosition: { competitiveAdvantage: [], marketShare: 0, priceLeadership: false },
          riskAssessment: { overallRisk: 'LOW', riskFactors: [], mitigation: [] },
        },
      };
    }

    // Generate comprehensive insights
    const [insights, recommendations, marketIntelligence, analytics] = await Promise.all([
      generateEnhancedInsights(books),
      generateSmartRecommendations(books, userId),
      generateMarketIntelligence(books),
      generateAdvancedAnalytics(books),
    ]);

    return {
      insights,
      recommendations,
      marketIntelligence,
      analytics,
    };
  } catch (error) {
    console.error('Error generating advanced insights:', error);
    throw error;
  }
}

/**
 * Generate enhanced AI insights with predictive analytics
 */
async function generateEnhancedInsights(books: any[]): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  
  // Portfolio overview
  const totalValue = books.reduce((sum, book) => sum + (book.currentPrice || 0), 0);
  const averagePrice = totalValue / books.length;
  
  // Price volatility analysis
  const priceChanges = books
    .filter(book => book.purchasePrice && book.currentPrice)
    .map(book => ((book.currentPrice - book.purchasePrice) / book.purchasePrice) * 100);
  
  const volatility = priceChanges.length > 0 
    ? Math.sqrt(priceChanges.reduce((sum, change) => sum + Math.pow(change, 2), 0) / priceChanges.length)
    : 0;

  insights.push({
    id: 'portfolio-volatility',
    type: 'market_analysis',
    title: 'Portfolio Volatility Analysis',
    description: `Your portfolio shows ${volatility > 20 ? 'high' : volatility > 10 ? 'moderate' : 'low'} price volatility`,
    impact: volatility > 20 ? 'high' : volatility > 10 ? 'medium' : 'low',
    confidence: 0.85,
    recommendations: [
      volatility > 20 ? 'Consider diversifying into more stable titles' : 'Maintain current diversification strategy',
      'Monitor high-volatility books for selling opportunities',
      'Set up price alerts for volatile titles'
    ],
    data: {
      volatility: volatility.toFixed(2),
      portfolioValue: totalValue,
      bookCount: books.length,
    },
  });

  // Seasonal trends analysis
  const currentMonth = new Date().getMonth();
  const seasonalInsight = getSeasonalInsight(currentMonth, books);
  insights.push(seasonalInsight);

  // High-value opportunities
  const highValueBooks = books
    .filter(book => book.currentPrice > 50)
    .sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0))
    .slice(0, 5);

  if (highValueBooks.length > 0) {
    insights.push({
      id: 'high-value-opportunities',
      type: 'opportunity',
      title: 'High-Value Inventory Detected',
      description: `${highValueBooks.length} books in your inventory are valued above $50`,
      impact: 'high',
      confidence: 0.9,
      recommendations: [
        'Consider listing high-value books on premium platforms',
        'Verify condition and authenticity for maximum value',
        'Monitor market demand for these titles'
      ],
      data: {
        highValueBooks: highValueBooks.map(book => ({
          title: book.title,
          currentPrice: book.currentPrice,
          isbn: book.isbn,
        })),
        totalValue: highValueBooks.reduce((sum, book) => sum + (book.currentPrice || 0), 0),
      },
    });
  }

  // Underperforming books analysis
  const underperformingBooks = books
    .filter(book => book.purchasePrice && book.currentPrice && book.currentPrice < book.purchasePrice * 0.8)
    .sort((a, b) => (a.currentPrice / a.purchasePrice) - (b.currentPrice / b.purchasePrice));

  if (underperformingBooks.length > 0) {
    insights.push({
      id: 'underperforming-inventory',
      type: 'risk',
      title: 'Underperforming Inventory Alert',
      description: `${underperformingBooks.length} books have lost significant value since purchase`,
      impact: 'medium',
      confidence: 0.8,
      recommendations: [
        'Consider liquidating underperforming titles',
        'Analyze market conditions for these books',
        'Adjust future purchasing strategy'
      ],
      data: {
        underperformingCount: underperformingBooks.length,
        averageLoss: underperformingBooks.reduce((sum, book) => 
          sum + ((book.purchasePrice - book.currentPrice) / book.purchasePrice) * 100, 0
        ) / underperformingBooks.length,
      },
    });
  }

  return insights;
}

/**
 * Generate smart recommendations based on AI analysis
 */
async function generateSmartRecommendations(books: any[], userId: string): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];

  // Analyze each book for recommendations
  for (const book of books) {
    const bookRecommendations = await analyzeBookForRecommendations(book);
    recommendations.push(...bookRecommendations);
  }

  // Portfolio-level recommendations
  const portfolioRecommendations = await generatePortfolioRecommendations(books);
  recommendations.push(...portfolioRecommendations);

  // Sort by priority and confidence
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence;
    })
    .slice(0, 10); // Top 10 recommendations
}

/**
 * Generate market intelligence for books
 */
async function generateMarketIntelligence(books: any[]): Promise<MarketIntelligence[]> {
  const intelligence: MarketIntelligence[] = [];

  // Group books by category/genre for market analysis
  const booksByCategory = new Map<string, any[]>();
  
  books.forEach(book => {
    const category = book.bookMetadata?.categories?.[0] || 'General';
    if (!booksByCategory.has(category)) {
      booksByCategory.set(category, []);
    }
    booksByCategory.get(category)!.push(book);
  });

  // Analyze each category
  for (const [category, categoryBooks] of booksByCategory) {
    const marketData = await analyzeMarketForCategory(category, categoryBooks);
    intelligence.push(marketData);
  }

  return intelligence;
}

/**
 * Generate advanced analytics
 */
async function generateAdvancedAnalytics(books: any[]): Promise<AdvancedAnalytics> {
  const totalValue = books.reduce((sum, book) => sum + (book.currentPrice || 0), 0);
  const totalInvestment = books.reduce((sum, book) => sum + (book.purchasePrice || 0), 0);
  
  // Calculate ROI
  const roi = totalInvestment > 0 ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0;
  
  // Calculate average holding time
  const now = new Date();
  const holdingTimes = books.map(book => {
    const purchaseDate = new Date(book.createdAt);
    return (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24); // days
  });
  const averageHoldingTime = holdingTimes.reduce((sum, time) => sum + time, 0) / holdingTimes.length;

  // Calculate portfolio health score
  const diversification = calculateDiversificationScore(books);
  const priceStability = calculatePriceStabilityScore(books);
  const liquidityRisk = calculateLiquidityRiskScore(books);
  const marketTiming = calculateMarketTimingScore(books);
  
  const portfolioHealthScore = (diversification + priceStability + liquidityRisk + marketTiming) / 4;

  return {
    portfolioHealth: {
      score: portfolioHealthScore,
      factors: {
        diversification,
        priceStability,
        liquidityRisk,
        marketTiming,
      },
    },
    profitabilityMetrics: {
      roi,
      averageHoldingTime,
      turnoverRate: calculateTurnoverRate(books),
      profitMargin: calculateProfitMargin(books),
    },
    marketPosition: {
      competitiveAdvantage: identifyCompetitiveAdvantages(books),
      marketShare: estimateMarketShare(books),
      priceLeadership: assessPriceLeadership(books),
    },
    riskAssessment: {
      overallRisk: assessOverallRisk(books),
      riskFactors: identifyRiskFactors(books),
      mitigation: suggestRiskMitigation(books),
    },
  };
}

// Helper functions for advanced analytics
function calculateDiversificationScore(books: any[]): number {
  const categories = new Set(books.map(book => book.bookMetadata?.categories?.[0] || 'General'));
  const authors = new Set(books.map(book => book.authors?.[0] || 'Unknown'));
  
  const categoryDiversity = Math.min(categories.size / 10, 1) * 50; // Max 50 points
  const authorDiversity = Math.min(authors.size / books.length, 1) * 50; // Max 50 points
  
  return categoryDiversity + authorDiversity;
}

function calculatePriceStabilityScore(books: any[]): number {
  const priceChanges = books
    .filter(book => book.purchasePrice && book.currentPrice)
    .map(book => Math.abs((book.currentPrice - book.purchasePrice) / book.purchasePrice));
  
  if (priceChanges.length === 0) return 50;
  
  const averageChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
  return Math.max(0, 100 - (averageChange * 100));
}

function calculateLiquidityRiskScore(books: any[]): number {
  // Simplified liquidity assessment based on price range
  const highValueBooks = books.filter(book => (book.currentPrice || 0) > 100).length;
  const totalBooks = books.length;
  
  const liquidityRisk = totalBooks > 0 ? (highValueBooks / totalBooks) * 100 : 0;
  return Math.max(0, 100 - liquidityRisk);
}

function calculateMarketTimingScore(books: any[]): number {
  // Simplified market timing based on recent performance
  const recentBooks = books.filter(book => {
    const purchaseDate = new Date(book.createdAt);
    const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePurchase <= 30;
  });
  
  if (recentBooks.length === 0) return 50;
  
  const recentPerformance = recentBooks
    .filter(book => book.purchasePrice && book.currentPrice)
    .map(book => (book.currentPrice - book.purchasePrice) / book.purchasePrice)
    .reduce((sum, perf) => sum + perf, 0) / recentBooks.length;
  
  return Math.max(0, Math.min(100, 50 + (recentPerformance * 100)));
}

function calculateTurnoverRate(books: any[]): number {
  // Simplified turnover calculation
  const averageHoldingTime = books.reduce((sum, book) => {
    const purchaseDate = new Date(book.createdAt);
    const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    return sum + daysSincePurchase;
  }, 0) / books.length;
  
  return 365 / averageHoldingTime; // Annual turnover rate
}

function calculateProfitMargin(books: any[]): number {
  const booksWithPrices = books.filter(book => book.purchasePrice && book.currentPrice);
  if (booksWithPrices.length === 0) return 0;
  
  const totalMargin = booksWithPrices.reduce((sum, book) => {
    return sum + ((book.currentPrice - book.purchasePrice) / book.purchasePrice);
  }, 0);
  
  return (totalMargin / booksWithPrices.length) * 100;
}

function identifyCompetitiveAdvantages(books: any[]): string[] {
  const advantages: string[] = [];
  
  // Check for rare/valuable books
  const highValueBooks = books.filter(book => (book.currentPrice || 0) > 100);
  if (highValueBooks.length > 0) {
    advantages.push('High-value inventory');
  }
  
  // Check for diverse portfolio
  const categories = new Set(books.map(book => book.bookMetadata?.categories?.[0] || 'General'));
  if (categories.size > 5) {
    advantages.push('Diversified portfolio');
  }
  
  // Check for fast turnover
  const turnoverRate = calculateTurnoverRate(books);
  if (turnoverRate > 4) {
    advantages.push('Fast inventory turnover');
  }
  
  return advantages;
}

function estimateMarketShare(books: any[]): number {
  // Simplified market share estimation
  // This would need real market data in production
  return Math.min(books.length / 1000, 1) * 100;
}

function assessPriceLeadership(books: any[]): boolean {
  // Simplified price leadership assessment
  const averagePrice = books.reduce((sum, book) => sum + (book.currentPrice || 0), 0) / books.length;
  return averagePrice > 25; // Arbitrary threshold
}

function assessOverallRisk(books: any[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  const portfolioValue = books.reduce((sum, book) => sum + (book.currentPrice || 0), 0);
  const highValueBooks = books.filter(book => (book.currentPrice || 0) > 100).length;
  const riskRatio = portfolioValue > 0 ? (highValueBooks / books.length) : 0;
  
  if (riskRatio > 0.3) return 'HIGH';
  if (riskRatio > 0.1) return 'MEDIUM';
  return 'LOW';
}

function identifyRiskFactors(books: any[]): string[] {
  const factors: string[] = [];
  
  const highValueBooks = books.filter(book => (book.currentPrice || 0) > 100);
  if (highValueBooks.length > books.length * 0.3) {
    factors.push('High concentration of expensive books');
  }
  
  const categories = new Set(books.map(book => book.bookMetadata?.categories?.[0] || 'General'));
  if (categories.size < 3) {
    factors.push('Limited category diversification');
  }
  
  return factors;
}

function suggestRiskMitigation(books: any[]): string[] {
  const suggestions: string[] = [];
  
  const highValueBooks = books.filter(book => (book.currentPrice || 0) > 100);
  if (highValueBooks.length > books.length * 0.3) {
    suggestions.push('Consider diversifying into lower-value, faster-moving titles');
  }
  
  const categories = new Set(books.map(book => book.bookMetadata?.categories?.[0] || 'General'));
  if (categories.size < 3) {
    suggestions.push('Expand into additional book categories');
  }
  
  suggestions.push('Set up price alerts for high-value inventory');
  suggestions.push('Monitor market trends regularly');
  
  return suggestions;
}

// Additional helper functions
function getSeasonalInsight(month: number, books: any[]): AIInsight {
  const seasonalData = {
    0: { season: 'Winter', trend: 'Educational books perform well due to new semester' },
    1: { season: 'Winter', trend: 'Romance novels peak around Valentine\'s Day' },
    2: { season: 'Spring', trend: 'Self-help and fitness books gain popularity' },
    3: { season: 'Spring', trend: 'Gardening and outdoor activity books increase' },
    4: { season: 'Spring', trend: 'Graduation season boosts textbook demand' },
    5: { season: 'Summer', trend: 'Travel and leisure reading peaks' },
    6: { season: 'Summer', trend: 'Children\'s books and summer reading programs' },
    7: { season: 'Summer', trend: 'Vacation and beach reading continues' },
    8: { season: 'Fall', trend: 'Back-to-school textbook season begins' },
    9: { season: 'Fall', trend: 'Academic and professional books peak' },
    10: { season: 'Fall', trend: 'Holiday preparation and cooking books rise' },
    11: { season: 'Winter', trend: 'Holiday gift books and year-end reading' },
  };

  const currentSeason = seasonalData[month];
  
  return {
    id: 'seasonal-trends',
    type: 'market_analysis',
    title: `${currentSeason.season} Market Trends`,
    description: currentSeason.trend,
    impact: 'medium',
    confidence: 0.75,
    recommendations: [
      'Adjust inventory based on seasonal demand',
      'Consider timing your listings for optimal visibility',
      'Monitor competitor pricing during peak seasons'
    ],
    data: {
      season: currentSeason.season,
      month: month,
      trend: currentSeason.trend,
    },
  };
}

async function analyzeBookForRecommendations(book: any): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];
  
  // Price-based recommendations
  if (book.purchasePrice && book.currentPrice) {
    const priceChange = (book.currentPrice - book.purchasePrice) / book.purchasePrice;
    
    if (priceChange > 0.5) { // 50% gain
      recommendations.push({
        id: `sell-${book.id}`,
        type: 'SELL_NOW',
        priority: 'HIGH',
        title: `Strong Sell Signal: ${book.title}`,
        description: `This book has gained ${(priceChange * 100).toFixed(1)}% in value`,
        reasoning: 'Significant price appreciation indicates optimal selling opportunity',
        actionItems: [
          'List on premium marketplace',
          'Verify current market demand',
          'Consider competitive pricing'
        ],
        confidence: 0.85,
        potentialValue: book.currentPrice - book.purchasePrice,
        timeframe: 'immediate',
        bookId: book.id,
      });
    } else if (priceChange < -0.3) { // 30% loss
      recommendations.push({
        id: `liquidate-${book.id}`,
        type: 'PRICE_ADJUSTMENT',
        priority: 'MEDIUM',
        title: `Consider Liquidation: ${book.title}`,
        description: `This book has lost ${Math.abs(priceChange * 100).toFixed(1)}% in value`,
        reasoning: 'Significant price decline suggests market weakness',
        actionItems: [
          'Reduce asking price',
          'Consider bulk liquidation',
          'Analyze market conditions'
        ],
        confidence: 0.7,
        potentialValue: book.currentPrice - book.purchasePrice,
        timeframe: 'short-term',
        bookId: book.id,
      });
    }
  }
  
  return recommendations;
}

async function generatePortfolioRecommendations(books: any[]): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];
  
  // Diversification recommendation
  const categories = new Set(books.map(book => book.bookMetadata?.categories?.[0] || 'General'));
  if (categories.size < 3) {
    recommendations.push({
      id: 'diversify-portfolio',
      type: 'BUY_MORE',
      priority: 'MEDIUM',
      title: 'Diversify Your Portfolio',
      description: 'Your inventory is concentrated in few categories',
      reasoning: 'Diversification reduces risk and increases market opportunities',
      actionItems: [
        'Explore new book categories',
        'Research trending genres',
        'Balance high and low-value titles'
      ],
      confidence: 0.8,
      potentialValue: 0,
      timeframe: 'medium-term',
    });
  }
  
  return recommendations;
}

async function analyzeMarketForCategory(category: string, books: any[]): Promise<MarketIntelligence> {
  const prices = books.map(book => book.currentPrice || 0).filter(price => price > 0);
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  return {
    priceVolatility: calculateVolatility(prices),
    demandTrend: 'MEDIUM', // Simplified
    supplyTrend: 'MEDIUM', // Simplified
    seasonalPattern: 'Stable year-round', // Simplified
    competitorAnalysis: {
      averagePrice,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      marketPosition: averagePrice > 30 ? 'ABOVE' : averagePrice < 15 ? 'BELOW' : 'COMPETITIVE',
    },
    predictedPrice: {
      nextWeek: averagePrice * 1.02, // Simplified 2% growth
      nextMonth: averagePrice * 1.05, // Simplified 5% growth
      confidence: 0.6,
    },
  };
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  
  return Math.sqrt(variance) / mean; // Coefficient of variation
} 