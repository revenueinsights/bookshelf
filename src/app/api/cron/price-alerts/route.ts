import { NextRequest, NextResponse } from 'next/server';
import { PriceAlertService } from '@/lib/services/price-alert.service';

export async function POST(request: NextRequest) {
  try {
    // Verify cron job authentication
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ANALYTICS_CRON_API_KEY;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting price alert check job...');
    const startTime = Date.now();

    // Check all active price alerts
    const results = await PriceAlertService.checkAllAlerts();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Count results
    const triggeredCount = results.filter(r => r.triggered).length;
    const totalChecked = results.length;

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      totalChecked,
      triggeredCount,
      results: results.map(r => ({
        alertId: r.alertId,
        triggered: r.triggered,
        currentPrice: r.currentPrice,
        targetPrice: r.targetPrice,
        reason: r.triggered ? r.reason : undefined,
      })),
    };

    console.log(`Price alert check completed: ${triggeredCount}/${totalChecked} alerts triggered in ${duration}ms`);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error in price alert cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
} 