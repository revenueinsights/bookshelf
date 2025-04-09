// src/app/api/analytics/batches/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AnalyticsService } from '@/lib/services/analytics.services';
import { prisma } from '@/lib/db';
import { TimeFrame } from '@prisma/client';

// This is the correct way to define params for dynamic routes in Next.js 15
interface Params {
  params: {
    id: string;
  }
}

export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const batchId = params.id;
    
    // Verify the batch belongs to the user
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        userId
      }
    });
    
    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found or unauthorized' },
        { status: 404 }
      );
    }
    
    const url = new URL(req.url);
    const timeFrame = (url.searchParams.get('timeFrame') as TimeFrame) || 'MONTH';
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    
    const data = await AnalyticsService.getBatchAnalyticsByTimeFrame(
      batchId,
      timeFrame,
      limit
    );
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching batch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch analytics data' },
      { status: 500 }
    );
  }
}