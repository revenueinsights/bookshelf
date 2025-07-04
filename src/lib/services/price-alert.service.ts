import { prisma } from '@/lib/db';
import { AlertType, AlertCondition, AlertFrequency, NotificationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { fetchBookPrice } from '@/lib/book-scouter';

interface AlertCheckResult {
  alertId: string;
  triggered: boolean;
  currentPrice: number;
  targetPrice: number;
  reason: string;
}

export class PriceAlertService {
  /**
   * Check all active price alerts and trigger notifications
   */
  static async checkAllAlerts(): Promise<AlertCheckResult[]> {
    const results: AlertCheckResult[] = [];

    try {
      // Get all active alerts
      const alerts = await prisma.priceAlert.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          book: true,
          user: {
            include: {
              userPreferences: true,
            },
          },
        },
      });

      console.log(`Checking ${alerts.length} active price alerts...`);

      for (const alert of alerts) {
        try {
          const result = await this.checkSingleAlert(alert);
          results.push(result);

          if (result.triggered) {
            await this.triggerAlert(alert, result.currentPrice, result.reason);
          }
        } catch (error) {
          console.error(`Error checking alert ${alert.id}:`, error);
          results.push({
            alertId: alert.id,
            triggered: false,
            currentPrice: 0,
            targetPrice: alert.targetPrice.toNumber(),
            reason: `Error checking alert: ${error}`,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in checkAllAlerts:', error);
      throw error;
    }
  }

  /**
   * Check a single price alert
   */
  private static async checkSingleAlert(alert: any): Promise<AlertCheckResult> {
    let currentPrice = 0;
    let reason = '';

    try {
      // Get current price
      if (alert.book) {
        // For books in inventory, use the stored current price or fetch fresh data
        const shouldFetchFresh = this.shouldFetchFreshPrice(alert);
        
        if (shouldFetchFresh) {
          const priceData = await fetchBookPrice(alert.book.isbn, alert.userId);
          currentPrice = priceData.currentPrice;
          
          // Update book's current price
          await prisma.book.update({
            where: { id: alert.book.id },
            data: {
              currentPrice: new Decimal(currentPrice),
              lastPriceUpdate: new Date(),
            },
          });
        } else {
          currentPrice = alert.book.currentPrice.toNumber();
        }
      } else if (alert.isbn) {
        // For ISBN-based alerts (books not in inventory)
        const priceData = await fetchBookPrice(alert.isbn, alert.userId);
        currentPrice = priceData.currentPrice;
      }

      // Check alert condition
      const triggered = this.evaluateAlertCondition(
        alert.condition,
        currentPrice,
        alert.targetPrice.toNumber(),
        alert.alertType
      );

      if (triggered) {
        reason = this.generateAlertReason(alert, currentPrice);
      }

      return {
        alertId: alert.id,
        triggered,
        currentPrice,
        targetPrice: alert.targetPrice.toNumber(),
        reason,
      };
    } catch (error) {
      console.error(`Error checking alert ${alert.id}:`, error);
      return {
        alertId: alert.id,
        triggered: false,
        currentPrice,
        targetPrice: alert.targetPrice.toNumber(),
        reason: `Error: ${error}`,
      };
    }
  }

  /**
   * Determine if we should fetch fresh price data
   */
  private static shouldFetchFreshPrice(alert: any): boolean {
    if (!alert.book.lastPriceUpdate) return true;

    const lastUpdate = new Date(alert.book.lastPriceUpdate);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    // Fetch fresh data based on alert frequency
    switch (alert.frequency) {
      case 'IMMEDIATE':
        return hoursSinceUpdate >= 1; // Every hour for immediate alerts
      case 'DAILY':
        return hoursSinceUpdate >= 24; // Daily
      case 'WEEKLY':
        return hoursSinceUpdate >= 168; // Weekly
      case 'MONTHLY':
        return hoursSinceUpdate >= 720; // Monthly (30 days)
      default:
        return hoursSinceUpdate >= 6; // Default: every 6 hours
    }
  }

  /**
   * Evaluate alert condition
   */
  private static evaluateAlertCondition(
    condition: AlertCondition,
    currentPrice: number,
    targetPrice: number,
    alertType: AlertType
  ): boolean {
    switch (condition) {
      case 'ABOVE':
        return currentPrice > targetPrice;
      case 'BELOW':
        return currentPrice < targetPrice;
      case 'EQUALS':
        return Math.abs(currentPrice - targetPrice) < 0.01; // Within 1 cent
      case 'PERCENTAGE_CHANGE':
        // For percentage change, we need historical data
        // This is a simplified implementation
        return Math.abs((currentPrice - targetPrice) / targetPrice) >= 0.1; // 10% change
      default:
        return false;
    }
  }

  /**
   * Generate alert reason message
   */
  private static generateAlertReason(alert: any, currentPrice: number): string {
    const bookTitle = alert.book?.title || `ISBN ${alert.isbn}`;
    const targetPrice = alert.targetPrice.toNumber();
    const difference = Math.abs(currentPrice - targetPrice);
    const percentChange = ((currentPrice - targetPrice) / targetPrice) * 100;

    switch (alert.alertType) {
      case 'PRICE_TARGET':
        return `${bookTitle} has reached your target price of $${targetPrice.toFixed(2)} (current: $${currentPrice.toFixed(2)})`;
      case 'PRICE_DROP':
        return `${bookTitle} price dropped to $${currentPrice.toFixed(2)} (${percentChange.toFixed(1)}% decrease)`;
      case 'PRICE_SPIKE':
        return `${bookTitle} price spiked to $${currentPrice.toFixed(2)} (${percentChange.toFixed(1)}% increase)`;
      default:
        return `${bookTitle} price alert triggered: $${currentPrice.toFixed(2)}`;
    }
  }

  /**
   * Trigger an alert and create notification
   */
  private static async triggerAlert(alert: any, currentPrice: number, reason: string): Promise<void> {
    try {
      // Check if we should throttle based on frequency
      if (alert.lastTriggered && !this.shouldTriggerBasedOnFrequency(alert)) {
        return;
      }

      // Update alert
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: {
          triggered: true,
          triggerCount: { increment: 1 },
          lastTriggered: new Date(),
          currentPrice: new Decimal(currentPrice),
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: alert.userId,
          priceAlertId: alert.id,
          type: 'PRICE_ALERT',
          title: this.getAlertTitle(alert.alertType),
          message: reason,
          data: {
            alertId: alert.id,
            bookId: alert.bookId,
            isbn: alert.isbn,
            currentPrice,
            targetPrice: alert.targetPrice.toNumber(),
            alertType: alert.alertType,
            condition: alert.condition,
          },
        },
      });

      // Send email notification if enabled
      if (alert.emailNotification && alert.user.userPreferences?.emailNotifications !== false) {
        await this.sendEmailNotification(alert, currentPrice, reason);
      }

      console.log(`Alert triggered: ${alert.id} - ${reason}`);
    } catch (error) {
      console.error(`Error triggering alert ${alert.id}:`, error);
    }
  }

  /**
   * Check if alert should trigger based on frequency settings
   */
  private static shouldTriggerBasedOnFrequency(alert: any): boolean {
    if (!alert.lastTriggered) return true;

    const lastTriggered = new Date(alert.lastTriggered);
    const now = new Date();
    const hoursSinceLastTrigger = (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60);

    switch (alert.frequency) {
      case 'IMMEDIATE':
        return true; // Always trigger immediately
      case 'DAILY':
        return hoursSinceLastTrigger >= 24;
      case 'WEEKLY':
        return hoursSinceLastTrigger >= 168;
      case 'MONTHLY':
        return hoursSinceLastTrigger >= 720;
      default:
        return hoursSinceLastTrigger >= 1; // Default: hourly
    }
  }

  /**
   * Get alert title based on type
   */
  private static getAlertTitle(alertType: AlertType): string {
    switch (alertType) {
      case 'PRICE_TARGET':
        return '🎯 Price Target Reached';
      case 'PRICE_DROP':
        return '📉 Price Drop Alert';
      case 'PRICE_SPIKE':
        return '📈 Price Spike Alert';
      case 'MARKET_TREND':
        return '📊 Market Trend Alert';
      case 'PROFIT_OPPORTUNITY':
        return '💰 Profit Opportunity';
      default:
        return '🔔 Price Alert';
    }
  }

  /**
   * Send email notification (placeholder - implement with your email service)
   */
  private static async sendEmailNotification(alert: any, currentPrice: number, reason: string): Promise<void> {
    // TODO: Implement email sending logic
    // This could use services like SendGrid, AWS SES, Nodemailer, etc.
    console.log(`Email notification would be sent: ${reason}`);
  }

  /**
   * Create a price alert for a book
   */
  static async createAlert(
    userId: string,
    alertData: {
      bookId?: string;
      isbn?: string;
      alertType: AlertType;
      targetPrice: number;
      condition?: AlertCondition;
      frequency?: AlertFrequency;
      emailNotification?: boolean;
      pushNotification?: boolean;
      expiresAt?: Date;
    }
  ) {
    return await prisma.priceAlert.create({
      data: {
        userId,
        bookId: alertData.bookId,
        isbn: alertData.isbn,
        alertType: alertData.alertType,
        targetPrice: new Decimal(alertData.targetPrice),
        condition: alertData.condition || 'BELOW',
        frequency: alertData.frequency || 'IMMEDIATE',
        emailNotification: alertData.emailNotification !== false,
        pushNotification: alertData.pushNotification === true,
        expiresAt: alertData.expiresAt,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            isbn13: true,
            authors: true,
            currentPrice: true,
            priceRank: true,
          },
        },
      },
    });
  }

  /**
   * Get user's active alerts
   */
  static async getUserAlerts(userId: string, options: {
    isActive?: boolean;
    alertType?: AlertType;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: any = { userId };

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options.alertType) {
      where.alertType = options.alertType;
    }

    return await prisma.priceAlert.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            isbn13: true,
            authors: true,
            currentPrice: true,
            priceRank: true,
          },
        },
        notifications: {
          where: { read: false },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }
} 