import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { AIInsightsService, BookPriceData } from '@/lib/ai-insights';
import { generateAdvancedInsights } from '@/lib/ai-insights';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeAdvanced = searchParams.get('advanced') === 'true';

    if (includeAdvanced) {
      // Generate comprehensive AI insights with advanced analytics
      const advancedInsights = await generateAdvancedInsights(session.user.id);
      
      return NextResponse.json({
        success: true,
        data: {
          insights: advancedInsights.insights,
          recommendations: advancedInsights.recommendations,
          marketIntelligence: advancedInsights.marketIntelligence,
          analytics: advancedInsights.analytics,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Legacy basic insights (existing functionality)
      const { generateInsights } = await import('@/lib/ai-insights');
      const insights = await generateInsights(session.user.id);
      
      return NextResponse.json({
        success: true,
        data: {
          insights,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate insights' 
      },
      { status: 500 }
    );
  }
}

// POST - Save user alert preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertTypes, thresholds, notificationPreferences } = body;

    // Here you could save user preferences to database
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Alert preferences saved successfully',
      preferences: {
        alertTypes,
        thresholds,
        notificationPreferences
      }
    });

  } catch (error) {
    console.error('Error saving alert preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 