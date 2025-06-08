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