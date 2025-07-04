import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { RecommendationType, RecommendationPriority } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// GET - Fetch user's smart recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as RecommendationType;
    const priority = searchParams.get('priority') as RecommendationPriority;
    const dismissed = searchParams.get('dismissed') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (dismissed !== undefined) {
      where.dismissed = dismissed;
    }

    // Only show non-expired recommendations
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];

    const recommendations = await prisma.smartRecommendation.findMany({
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
            purchasePrice: true,
            priceRank: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.smartRecommendation.count({ where });

    // Group recommendations by type for better organization
    const groupedRecommendations = recommendations.reduce((acc, rec) => {
      if (!acc[rec.type]) {
        acc[rec.type] = [];
      }
      acc[rec.type].push(rec);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      recommendations,
      groupedRecommendations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching smart recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new smart recommendation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookId,
      isbn,
      type,
      priority,
      title,
      description,
      reasoning,
      actionItems,
      confidence,
      potentialValue,
      expiresAt,
    } = body;

    // Validation
    if (!type || !title || !description || !reasoning) {
      return NextResponse.json(
        { error: 'Type, title, description, and reasoning are required' },
        { status: 400 }
      );
    }

    if (confidence < 0 || confidence > 100) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 100' },
        { status: 400 }
      );
    }

    const recommendation = await prisma.smartRecommendation.create({
      data: {
        userId: session.user.id,
        bookId,
        isbn,
        type: type as RecommendationType,
        priority: (priority as RecommendationPriority) || 'MEDIUM',
        title,
        description,
        reasoning,
        actionItems: actionItems || [],
        confidence: new Decimal(confidence),
        potentialValue: potentialValue ? new Decimal(potentialValue) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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
            purchasePrice: true,
            priceRank: true,
          },
        },
      },
    });

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error('Error creating smart recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a smart recommendation (dismiss, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, dismissed, dismissedAt, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    // Check if recommendation belongs to user
    const existingRecommendation = await prisma.smartRecommendation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingRecommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Prepare update data
    const data: any = { ...updateData };
    
    if (dismissed !== undefined) {
      data.dismissed = dismissed;
      data.dismissedAt = dismissed ? new Date() : null;
    }

    if (data.confidence !== undefined) {
      data.confidence = new Decimal(data.confidence);
    }

    if (data.potentialValue !== undefined) {
      data.potentialValue = data.potentialValue ? new Decimal(data.potentialValue) : null;
    }

    const recommendation = await prisma.smartRecommendation.update({
      where: { id },
      data,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            isbn13: true,
            authors: true,
            currentPrice: true,
            purchasePrice: true,
            priceRank: true,
          },
        },
      },
    });

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Error updating smart recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a smart recommendation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    // Check if recommendation belongs to user
    const existingRecommendation = await prisma.smartRecommendation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingRecommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    await prisma.smartRecommendation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting smart recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 