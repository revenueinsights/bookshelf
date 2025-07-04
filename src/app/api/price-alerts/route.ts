import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { AlertType, AlertCondition, AlertFrequency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// GET - Fetch user's price alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');
    const alertType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (alertType) {
      where.alertType = alertType as AlertType;
    }

    const alerts = await prisma.priceAlert.findMany({
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
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.priceAlert.count({ where });

    return NextResponse.json({
      alerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new price alert
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
      alertType,
      targetPrice,
      condition,
      frequency,
      emailNotification,
      pushNotification,
      expiresAt,
    } = body;

    // Validation
    if (!alertType || !targetPrice) {
      return NextResponse.json(
        { error: 'Alert type and target price are required' },
        { status: 400 }
      );
    }

    if (!bookId && !isbn) {
      return NextResponse.json(
        { error: 'Either bookId or ISBN is required' },
        { status: 400 }
      );
    }

    // If ISBN is provided but no bookId, check if book exists
    let resolvedBookId = bookId;
    if (!bookId && isbn) {
      const book = await prisma.book.findFirst({
        where: {
          OR: [
            { isbn: isbn },
            { isbn13: isbn },
          ],
          userId: session.user.id,
        },
      });
      resolvedBookId = book?.id;
    }

    // Create the alert
    const alert = await prisma.priceAlert.create({
      data: {
        userId: session.user.id,
        bookId: resolvedBookId,
        isbn: !resolvedBookId ? isbn : undefined,
        alertType: alertType as AlertType,
        targetPrice: new Decimal(targetPrice),
        condition: (condition as AlertCondition) || 'BELOW',
        frequency: (frequency as AlertFrequency) || 'IMMEDIATE',
        emailNotification: emailNotification !== false,
        pushNotification: pushNotification === true,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
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

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating price alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an existing price alert
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Check if alert belongs to user
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Prepare update data
    const data: any = { ...updateData };
    if (data.targetPrice) {
      data.targetPrice = new Decimal(data.targetPrice);
    }
    if (data.expiresAt) {
      data.expiresAt = new Date(data.expiresAt);
    }

    const alert = await prisma.priceAlert.update({
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
            priceRank: true,
          },
        },
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating price alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a price alert
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Check if alert belongs to user
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    await prisma.priceAlert.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 