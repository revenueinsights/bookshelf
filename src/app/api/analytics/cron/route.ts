
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics.services';

// This endpoint would be called by a CRON job or scheduled task
export async function POST(req: NextRequest) {
  try {
    // Check for API key or other authentication
    const apiKey = req.headers.get('x-api-key');
    
    // In production, you would validate the API key here
    if (!apiKey || apiKey !== process.env.ANALYTICS_CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Run the scheduler for all users
    const result = await AnalyticsService.scheduleAnalyticsSnapshots();
    
    return NextResponse.json({
      message: 'Analytics snapshots scheduled successfully',
      ...result
    });
  } catch (error) {
    console.error('Error scheduling analytics snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to schedule analytics snapshots' },
      { status: 500 }
    );
  }
}