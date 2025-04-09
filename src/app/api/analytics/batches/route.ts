
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics.services';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { TimeFrame } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const url = new URL(req.url);
    
    // Get parameters from query string
    const batchIds = url.searchParams.getAll('batchId');
    const timeFrame = (url.searchParams.get('timeFrame') as TimeFrame) || 'MONTH';
    
    // If no batch IDs are specified, get data for all user's batches
    if (batchIds.length === 0) {
      const batches = await prisma.batch.findMany({
        where: { userId },
        select: { id: true }
      });
      
      const allBatchIds = batches.map(batch => batch.id);
      
      const data = await AnalyticsService.getComparisonDataForBatches(
        allBatchIds,
        timeFrame
      );
      
      return NextResponse.json({ data });
    }
    
    // Verify that all requested batches belong to the user
    const batches = await prisma.batch.findMany({
      where: {
        id: { in: batchIds },
        userId
      },
      select: { id: true }
    });
    
    const verifiedBatchIds = batches.map(batch => batch.id);
    
    if (verifiedBatchIds.length !== batchIds.length) {
      return NextResponse.json(
        { error: 'One or more batches not found or unauthorized' },
        { status: 403 }
      );
    }
    
    // Get comparative data for the selected batches
    const data = await AnalyticsService.getComparisonDataForBatches(
      verifiedBatchIds,
      timeFrame
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
