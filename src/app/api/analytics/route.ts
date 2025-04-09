// app/api/analytics/route.ts

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics.services';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TimeFrame } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const url = new URL(req.url);
    const timeFrame = (url.searchParams.get('timeFrame') as TimeFrame) || 'MONTH';
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    
    const data = await AnalyticsService.getUserAnalyticsByTimeFrame(
      userId,
      timeFrame,
      limit
    );
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Generate analytics snapshots for the user
    const snapshots = await AnalyticsService.createUserAnalyticsSnapshot(userId);
    
    // Generate batch snapshots
    const batchSnapshots = await AnalyticsService.createBatchSnapshots(userId);
    
    return NextResponse.json({
      message: 'Analytics snapshots created successfully',
      userSnapshots: snapshots?.length || 0,
      batchSnapshots: batchSnapshots.length
    });
  } catch (error) {
    console.error('Error creating analytics snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create analytics snapshot' },
      { status: 500 }
    );
  }
}

// app/api/analytics/batches/route.ts

// app/api/analytics/batches/[id]/route.ts


// app/api/analytics/cron/route.ts
